import { NextResponse } from 'next/server';
import { BUCKET } from '@/lib/constants';
import { requireAdmin, supabaseService } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Permanently deletes a candidate with all documents, notes and history
// (used for erasure requests). Super admins only.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdmin(['super_admin']);
  if ('error' in ctx) return ctx.error;

  const db = supabaseService();
  const { data: docs } = await db.from('candidate_documents').select('storage_path').eq('candidate_id', params.id);
  const paths = (docs || []).map((d) => d.storage_path);
  if (paths.length) await db.storage.from(BUCKET).remove(paths);

  const { error } = await db.from('candidates').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not delete the candidate.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
