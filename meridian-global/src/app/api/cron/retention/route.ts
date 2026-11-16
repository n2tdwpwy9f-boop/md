import { NextResponse } from 'next/server';
import { BUCKET } from '@/lib/constants';
import { supabaseService } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Data retention job. Deletes candidate records (and their files) whose retention
// period has expired and that are not in an active recruitment process.
// Call daily with the header:  Authorization: Bearer <CRON_SECRET>
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const db = supabaseService();
  const { data: expired, error } = await db
    .from('candidates')
    .select('id')
    .lt('retention_expires_at', new Date().toISOString())
    .in('status', ['new', 'under_review', 'suitable', 'rejected', 'on_hold'])
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (expired || []).map((c) => c.id);
  if (!ids.length) return NextResponse.json({ deleted: 0 });

  const { data: docs } = await db.from('candidate_documents').select('storage_path').in('candidate_id', ids);
  const paths = (docs || []).map((d) => d.storage_path);
  for (let i = 0; i < paths.length; i += 100) {
    await db.storage.from(BUCKET).remove(paths.slice(i, i + 100));
  }
  await db.from('candidates').delete().in('id', ids);
  return NextResponse.json({ deleted: ids.length });
}
