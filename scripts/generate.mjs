function wrapHtml({
  title,
  description,
  bodyHtml,
  isoDate,
  category,
  tags,
  canonicalUrl,
  related = [], // [{title, url, date, category, description}]
}) {
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const tagHtml = (tags || [])
    .slice(0, 12)
    .map((t) => `<span class="tag">${esc(t)}</span>`)
    .join("");

  const can = canonicalUrl ? `<link rel="canonical" href="${esc(canonicalUrl)}">` : "";

  const jsonLd = canonicalUrl
    ? `<script type="application/ld+json">${JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: description,
          datePublished: isoDate,
          dateModified: isoDate,
          mainEntityOfPage: canonicalUrl,
          author: { "@type": "Organization", name: "SIN JAPAN" },
          publisher: { "@type": "Organization", name: "SIN JAPAN" },
        },
        null,
        0
      )}</script>`
    : "";

  const relatedHtml = (related || [])
    .slice(0, 4)
    .map(
      (x) => `
      <a class="relCard" href="${esc(x.url)}" target="_blank" rel="noopener">
        <div class="relTitle">${esc(x.title)}</div>
        <div class="relMeta">${esc(x.date || "")}${x.category ? " ・ " + esc(x.category) : ""}</div>
        <div class="relDesc">${esc(x.description || "")}</div>
      </a>
    `
    )
    .join("");

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)} | SIN JAPAN 公式コラム</title>
  <meta name="description" content="${esc(description)}">
  ${can}
  ${jsonLd}

  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:site_name" content="SIN JAPAN 公式コラム">

  <style>
    :root{
      --bg0:#050816;
      --bg1:#0b1430;
      --card: rgba(255,255,255,.95);
      --ink: #0b1220;
      --muted: rgba(11,18,32,.72);
      --line: rgba(255,255,255,.14);
      --r: 22px;

      --shadow: 0 30px 90px rgba(2,6,23,.30);
      --shadow2: 0 18px 54px rgba(2,6,23,.14);

      --max: 1020px;
      --read: 720px;
      --a: #0a5bd3;
    }
    *{box-sizing:border-box}
    html,body{margin:0;padding:0}
    body{
      font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP","Hiragino Sans","Yu Gothic",Meiryo,system-ui,sans-serif;
      color:var(--ink);
      background:
        radial-gradient(900px 420px at 15% -5%, rgba(56,189,248,.28), transparent 60%),
        radial-gradient(1000px 520px at 90% 10%, rgba(59,130,246,.30), transparent 62%),
        linear-gradient(180deg, var(--bg0), var(--bg1) 40%, #f6f8ff 140%);
      min-height:100vh;
    }

    .wrap{max-width:var(--max);margin:0 auto;padding:22px 16px 78px}

    /* ===== HERO ===== */
    .hero{
      border-radius: calc(var(--r) + 10px);
      overflow:hidden;
      position:relative;
      background:
        radial-gradient(900px 350px at 20% 0%, rgba(56,189,248,.35), transparent 60%),
        radial-gradient(900px 380px at 85% 20%, rgba(59,130,246,.40), transparent 62%),
        linear-gradient(135deg,#071a3a,#0a2a63 35%, #0b3a8a 70%, #0a5bd3);
      box-shadow: var(--shadow);
      padding:22px 18px;
      color:#fff;
    }
    .hero:before{
      content:"";
      position:absolute;inset:0;
      background-image: radial-gradient(rgba(255,255,255,.14) 1px, transparent 1px);
      background-size: 18px 18px;
      opacity:.35;
      pointer-events:none;
    }
    .heroInner{position:relative}
    .badge{
      display:inline-flex;align-items:center;
      padding:6px 10px;border-radius:999px;
      border:1px solid var(--line);
      background:rgba(255,255,255,.10);
      backdrop-filter: blur(10px);
      font-size:12px;font-weight:900;letter-spacing:.02em;
    }
    .h1{
      margin:10px 0 10px;
      font-size:34px;line-height:1.16;letter-spacing:-.02em;
    }
    .meta{
      display:flex;gap:10px;flex-wrap:wrap;align-items:center;
      font-size:12px;opacity:.92;
    }
    .dot{opacity:.6}
    .tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .tag{
      border:1px solid var(--line);
      background:rgba(255,255,255,.10);
      color:#fff;
      padding:6px 10px;border-radius:999px;
      font-size:12px;font-weight:900;
    }
    .crumb{
      margin-top:14px;
      display:flex;gap:10px;flex-wrap:wrap;align-items:center;
    }
    .crumb a{
      color:rgba(255,255,255,.92);
      text-decoration:none;
      font-weight:900;
      border:1px solid var(--line);
      background:rgba(255,255,255,.08);
      padding:9px 12px;border-radius:14px;
    }
    .crumb a:hover{background:rgba(255,255,255,.14)}
    .crumb .ghost{opacity:.82}

    /* ===== ARTICLE CARD ===== */
    .card{
      margin-top:-18px;
      border-radius: var(--r);
      background: var(--card);
      box-shadow: var(--shadow2);
      border:1px solid rgba(0,0,0,.06);
      overflow:hidden;
    }

    /* ===== TOC ===== */
    .toc{
      max-width:var(--read);
      margin:18px auto 0;
      background:#fff;
      border:1px solid rgba(0,0,0,.06);
      border-radius:16px;
      padding:14px 16px;
    }
    .tocTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .tocTitle{margin:0;font-size:13px;color:rgba(11,18,32,.78);font-weight:1000}
    .tocBtn{
      border:1px solid rgba(0,0,0,.10);
      background:#fff;
      border-radius:12px;
      padding:8px 10px;
      font-size:12px;
      cursor:pointer;
      font-weight:900;
    }
    .tocList{margin:10px 0 0;padding:0;list-style:none}
    .tocList a{
      display:block;
      padding:7px 0;
      text-decoration:none;
      color:var(--a);
      font-size:13px;
      font-weight:900;
      border-bottom:1px dashed rgba(0,0,0,.06);
    }
    .tocList li:last-child a{border-bottom:none}
    .tocList a:hover{text-decoration:underline}

    /* ===== CONTENT (READABILITY) ===== */
    .content{
      max-width:var(--read);
      margin:0 auto;
      padding:26px 22px 10px;
    }
    .content p{
      line-height:2.0;
      letter-spacing:.02em;
      color:rgba(11,18,32,.86);
      margin:14px 0;
      font-size:15px;
    }
    .content h2{
      margin:34px 0 14px;
      font-size:20px;
      letter-spacing:-.01em;
      padding:8px 12px;
      border-left:6px solid rgba(59,130,246,.75);
      background:linear-gradient(90deg, rgba(10,91,211,.10), transparent);
      border-radius:12px;
    }
    .content h3{
      margin:22px 0 10px;
      font-size:16px;
      letter-spacing:-.01em;
    }
    .content ul, .content ol{
      margin:14px 0 18px;
      padding:14px 18px 14px 32px;
      background:#f6f8ff;
      border:1px solid rgba(0,0,0,.05);
      border-radius:14px;
      line-height:1.9;
    }
    .content li{margin:6px 0}
    .content a{color:var(--a);font-weight:1000;text-decoration:none}
    .content a:hover{text-decoration:underline}
    .content hr{border:none;border-top:1px solid rgba(0,0,0,.08);margin:22px 0}
    .content blockquote{
      margin:16px 0;
      padding:12px 14px;
      border-left:5px solid rgba(10,91,211,.65);
      background:#f9fbff;
      border-radius:14px;
      color:rgba(11,18,32,.80);
    }
    .content code{
      background:rgba(10,91,211,.06);
      border:1px solid rgba(10,91,211,.12);
      padding:2px 6px;
      border-radius:8px;
      font-weight:900;
    }
    .content pre{
      overflow:auto;
      padding:14px 16px;
      border-radius:14px;
      background:#0b1220;
      color:#e8eefc;
      box-shadow:0 12px 28px rgba(2,6,23,.18);
    }
    .content pre code{background:transparent;border:none;padding:0;color:inherit}

    /* ===== RELATED ===== */
    .related{
      max-width:var(--read);
      margin:10px auto 26px;
      padding:0 22px 20px;
    }
    .relHead{
      font-size:13px;
      color:rgba(11,18,32,.78);
      font-weight:1000;
      margin:0 0 10px;
    }
    .relGrid{
      display:grid;
      grid-template-columns:1fr;
      gap:10px;
    }
    .relCard{
      display:block;
      text-decoration:none;
      color:inherit;
      border:1px solid rgba(0,0,0,.06);
      background:#fff;
      border-radius:16px;
      padding:12px 12px;
      box-shadow:0 10px 26px rgba(0,0,0,.06);
    }
    .relTitle{font-weight:1000;font-size:14px;line-height:1.4}
    .relMeta{font-size:12px;color:rgba(11,18,32,.66);margin-top:4px}
    .relDesc{font-size:12px;color:rgba(11,18,32,.78);margin-top:6px;line-height:1.7}
    .relCard:hover{transform:translateY(-1px)}
    @media(min-width:900px){
      .relGrid{grid-template-columns:1fr 1fr}
    }

    /* ===== NOTE & FOOTER ===== */
    .note{
      padding:16px 22px;
      border-top:1px solid rgba(0,0,0,.06);
      background: linear-gradient(180deg, rgba(10,91,211,.05), rgba(56,189,248,.03));
      color:rgba(11,18,32,.74);
      font-size:12px;
      line-height:1.75;
    }
    .footer{
      margin-top:14px;
      display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;
      color:rgba(255,255,255,.72);
    }
    .footer a{color:rgba(255,255,255,.92);text-decoration:none;font-weight:1000}

    /* ===== MOBILE CTA BAR ===== */
    .bar{
      position:fixed;left:0;right:0;bottom:0;
      padding:10px 12px;
      background: rgba(5,8,22,.72);
      backdrop-filter: blur(10px);
      border-top:1px solid rgba(255,255,255,.12);
      display:flex;gap:10px;justify-content:center;
    }
    .btn{
      max-width:var(--max);flex:1;
      text-align:center;
      padding:12px 14px;border-radius:16px;
      background: linear-gradient(135deg,#0a2a63,#0a5bd3);
      color:#fff;text-decoration:none;font-weight:1000;
      box-shadow: 0 18px 50px rgba(2,6,23,.28);
    }
    .btn:hover{opacity:.92}

    @media(min-width:900px){
      .bar{display:none}
    }
  </style>
</head>

<body>
  <div class="wrap">
    <header class="hero">
      <div class="heroInner">
        <div class="badge">SIN JAPAN Official Column</div>
        <h1 class="h1">${esc(title)}</h1>
        <div class="meta">
          <span>${esc(isoDate)}</span>
          <span class="dot">•</span>
          <span>${esc(category || "")}</span>
        </div>
        <div class="tags">${tagHtml}</div>

        <div class="crumb">
          <a href="https://sinjapanllc.github.io/sinjapan-column/" target="_blank" rel="noopener">コラム一覧へ</a>
          <span class="ghost">※記事は毎日自動更新</span>
        </div>
      </div>
    </header>

    <main class="card">
      <div class="toc" id="tocBox" style="display:none;">
        <div class="tocTop">
          <h3 class="tocTitle">目次</h3>
          <button class="tocBtn" id="tocToggle" type="button">開く</button>
        </div>
        <ul class="tocList" id="tocList"></ul>
      </div>

      <article class="content" id="article">
        ${bodyHtml}
      </article>

      ${
        relatedHtml
          ? `<section class="related">
              <h3 class="relHead">関連記事</h3>
              <div class="relGrid">${relatedHtml}</div>
            </section>`
          : ""
      }

      <div class="note">
        ※本記事は一般的情報です。契約・税務・法務は個別事情で変わるため、最終判断は専門家へ。<br/>
        SIN JAPAN（物流・人材・IT）に関するご相談はお問い合わせから。
      </div>
    </main>

    <div class="footer">
      <div>© SIN JAPAN</div>
      <div><a href="https://sinjapan.work" target="_blank" rel="noopener">お問い合わせ</a></div>
    </div>
  </div>

  <div class="bar">
    <a class="btn" href="https://sinjapan.work" target="_blank" rel="noopener">見積・お問い合わせ</a>
  </div>

  <script>
    (function(){
      const article = document.getElementById("article");
      if(!article) return;

      // H2にIDを付与して目次生成
      const h2s = Array.from(article.querySelectorAll("h2"));
      if(h2s.length === 0) return;

      const tocBox = document.getElementById("tocBox");
      const tocList = document.getElementById("tocList");
      const tocToggle = document.getElementById("tocToggle");

      const slugify = (s)=> (s||"")
        .toLowerCase()
        .replace(/[^a-z0-9\\u3040-\\u30ff\\u3400-\\u9fff\\s-]/g,"")
        .replace(/\\s+/g,"-")
        .replace(/-+/g,"-")
        .replace(/^-|-$/g,"")
        .slice(0,60);

      const used = new Set();
      const items = h2s.map((h2, idx)=>{
        const text = (h2.textContent||"").trim();
        let id = slugify(text) || ("sec-" + (idx+1));
        while(used.has(id)) id = id + "-" + (idx+1);
        used.add(id);
        h2.id = id;
        return { id, text };
      });

      tocList.innerHTML = items.map(x =>
        '<li><a href="#' + x.id + '">' + x.text.replace(/</g,"&lt;").replace(/>/g,"&gt;") + '</a></li>'
      ).join("");

      tocBox.style.display = "block";

      let open = false;
      const set = ()=>{
        open = !open;
        tocToggle.textContent = open ? "閉じる" : "開く";
        tocList.style.display = open ? "block" : "none";
      };
      tocList.style.display = "none";
      tocToggle.addEventListener("click", set);
    })();
  </script>
</body>
</html>`;
}
