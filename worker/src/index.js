// worker/src/index.js
// Cloudflare Worker: token-based access to client sites
//
// URL format: https://spletne-strani-slovenija.pages.dev/?t=<token>
//
// Token → site slug mapping stored in Cloudflare KV (binding: TOKENS).
// Tokens are 16-char hex strings (UUID4 truncated). One per client.
// Worker validates token, rewrites URL to /sites/<slug>/, and serves the page.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check / readiness probe (no token needed)
    if (url.pathname === '/_health') {
      return new Response('ok', { status: 200 });
    }

    // Token validation: read from ?t= query param
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
      // KV error — fail closed (do not serve the site)
      return new Response('Service temporarily unavailable', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Token not found in KV → 404
    if (!slug) {
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Rewrite URL: ?t=xxx → /sites/<slug>/
    url.searchParams.delete('t');
    url.pathname = `/sites/${slug}/`;

    // Forward the rewritten request to the Pages origin
    // In production this is the same Pages project, so the relative path works
    const newRequest = new Request(url, request);
    return fetch(newRequest);
  },
};
