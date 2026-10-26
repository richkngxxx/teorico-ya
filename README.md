# Teórico Ya *(placeholder working name)*

Free, mobile-first PWA to practise the Spanish driving theory test (permiso B). Static HTML/CSS/JS, no build, no accounts, no payments.

**No afiliado a la DGT / Not affiliated with the DGT.** Questions are original, written from the Reglamento General de Circulación (RD 1428/2003) and the public driver manual; each cites its article. They are not official questions.

## Layout
- `index.html` landing · `app/` PWA · `creditos/` sign credits · `sobre/` about · `senales/` signs guide (from signs.json) · `blog/` articles · `sitemap.xml`, `robots.txt`
- `data/questions.json` (id, topic, question, options[3], answer index, explanation{es,en}, article, trap)
- `data/signs.json` + `signs/*.svg` (Wikimedia Commons, public domain only, licence checked per file)
- `i18n/<lang>.json` UI strings; `assets/i18n.js` lists languages. To add AR/RO/UK/ZH: add the JSON (`"dir":"rtl"` for ar), add to `LANGS`, add `explanation.<lang>` and `name.<lang>`; missing keys fall back to ES. Question text stays in Spanish.
- `sw.js` offline cache (bump `V` when files change), `manifest.webmanifest`

## Analytics
GoatCounter snippet is commented out in `index.html` and `app/index.html`. Create a free account, replace `CODE`, uncomment.

## UTM links
| Channel | Link |
|---|---|
| TikTok | https://richkngxxx.github.io/teorico-ya/?utm_source=tiktok&utm_medium=social&utm_campaign=launch |
| Instagram | https://richkngxxx.github.io/teorico-ya/?utm_source=ig&utm_medium=social&utm_campaign=launch |
| YouTube | https://richkngxxx.github.io/teorico-ya/?utm_source=yt&utm_medium=video&utm_campaign=launch |
| Facebook | https://richkngxxx.github.io/teorico-ya/?utm_source=fb&utm_medium=social&utm_campaign=launch |

Use `utm_content` for the post/video id. Add `app/` before `?` to deep-link into the app.

## Local
`python3 -m http.server 8080` then open http://localhost:8080/
