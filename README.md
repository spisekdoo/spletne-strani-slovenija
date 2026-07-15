# Spletne strani Slovenija

Spletne strani za lokalna slovenska podjetja (Tier 1) — lead-gen pipeline + monorepo s `sites/<slug>/` mapami.

**Owner:** Boštjan Klajnščak (Spisek) · **Org:** `spisekdoo` · **Stack:** Cloudflare Pages + Cloudflare Worker + GitHub + Ollama/M3

---

## Arhitektura

```
spletne-strani-slovenija/
├── sites/                       # vsaka stranka = 1 mapa
│   └── _example/                # demo site (token: 7782c57e22f3993c)
│       ├── index.html
│       └── assets/
├── shared/                      # skupni template (CSS, JS, vključki)
│   ├── css/
│   ├── js/
│   └── _includes/
├── scripts/                     # pomožni skripti (bash)
│   ├── new-site.sh              # scaffold novo stranko
│   └── validate-site.sh         # preveri, da je site veljaven
├── worker/                      # Cloudflare Worker (token validation)
│   ├── src/
│   │   └── index.js
│   ├── wrangler.toml
│   └── package.json
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml     # auto-deploy Pages
│       └── deploy-worker.yml    # auto-deploy Worker
├── _redirects                   # Cloudflare Pages redirects
├── _headers                     # Cloudflare Pages security headers
└── README.md
```

## Tok za 1 stranko

1. **Lead identificiran** (Hermes Agent) → dodan v HubSpot CRM
2. **Scaffold** (`./scripts/new-site.sh avtomehanika-kd`) → ustvari `sites/avtomehanika-kd/`
3. **Generiraj vsebino** (Ollama + M3) → personalizirana HTML stran
4. **Generiraj token** (16-char UUID4) → dodan v Worker KV
5. **Commit + push** → Cloudflare Pages + Worker auto-deploy
6. **Pošlji email stranki** z URL-jem: `https://spletne-strani-slovenija.pages.dev/?t=<token>`
7. **Sledenje** (HubSpot Sales extension) → odprtost, kliki, reply

## URL format

- **Demo:** https://spletne-strani-slovenija.pages.dev/?t=7782c57e22f3993c
- **Brez tokena:** 404 (izolacija — vsaka stranka vidi le svojo stran)
- **Custom domena (po podpisu):** `avtomehanika-kd.spletne-strani-slovenija.pages.dev` ali `avtomehanika-kd.si`

## Kako dodati novo stranko

```bash
# 1. Skripta ustvari mapo + index.html
./scripts/new-site.sh avtomehanika-kd "Avtomehanika Kd" "Koper"

# 2. Personaliziraj vsebino v sites/avtomehanika-kd/index.html
$EDITOR sites/avtomehanika-kd/index.html

# 3. Generiraj token + dodaj v Worker KV
TOKEN=$(python3 -c "import secrets; print(secrets.token_hex(8))")
echo "Token: $TOKEN"
wrangler kv:key put --binding=TOKENS "$TOKEN" "avtomehanika-kd"

# 4. Commit + push
git add sites/avtomehanika-kd/
git commit -m "feat: dodaj avtomehanika-kd site"
git push

# 5. Pošlji URL stranki
echo "https://spletne-strani-slovenija.pages.dev/?t=$TOKEN"
```

## Development

```bash
# Lokalno testiranje Workerja
cd worker
npm install
wrangler dev

# Lokalno testiranje site (Python http.server)
cd sites/_example
python3 -m http.server 8000
# → http://localhost:8000
```

## Licenca

Proprietary (Spisek).
