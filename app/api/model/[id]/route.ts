import { serveModelFile } from '@/lib/upload-3d/serve-model-file'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return serveModelFile(id, undefined)
}
