// functions/_middleware.js
// Cloudflare Pages Function: token-based access (alternative to standalone Worker)
// Place this in the Pages project's functions/ directory — it runs on every request.
//
// This is the RECOMMENDED approach for Cloudflare Pages (simpler than wrangler deploy).
// The standalone worker/src/ is kept for reference / future flexibility.

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Health check bypass
  if (url.pathname === '/_health') {
    return new Response('ok', { status: 200 });
  }

  // Static assets (CSS, JS, images) — pass through with token
  // These are requested by the HTML page after token validation
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/i)) {
    return next();
  }

  // Token validation
  const token = url.searchParams.get('t');

  // No token → 404 (do not leak that the site exists)
  if (!token) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Validate token format: 16 hex chars
  if (!/^[a-f0-9]{16}$/i.test(token)) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Look up site slug in KV
  let slug = null;
  try {
    slug = await env.TOKENS.get(token);
  } catch (e) {
    return new Response('Service temporarily unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (!slug) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Rewrite: ?t=xxx → /sites/<slug>/
  url.searchParams.delete('t');
  url.pathname = `/sites/${slug}/`;

  // Pass through with rewritten URL
  return next(new Request(url, request));
}
