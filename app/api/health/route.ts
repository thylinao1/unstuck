// GET /api/health, a 5-second post-deploy sanity check.
// Reports whether the AI path is actually wired (key present) so a missing
// Vercel env var surfaces loudly instead of silently serving 100% fallback.
// Never exposes the key itself.

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const aiConfigured = Boolean(process.env.ANTHROPIC_API_KEY)
  return Response.json({
    ok: true,
    triage: aiConfigured ? 'ai' : 'fallback-only',
  })
}
