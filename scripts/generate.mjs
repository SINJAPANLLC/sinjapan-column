function wrapHtml({title, description, bodyHtml, isoDate, category, tags, canonicalUrl}) {
  const tagHtml = (tags||[]).slice(0,8).map(t=>`<a class="tag" href="#" onclick="return false;">${t}</a>`).join("");
  const can = canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : "";

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} | SIN JAPAN 公式コラム</title>
  <meta name="description" content="${description}">
  ${can}

  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:site_name" content="SIN JAPAN 公式コラム">

  <style>
    :root{
      --bg: #070b18;
      --ink: #0b1220;
      --muted: rgba(11,18,32,.72);
      --card: rgba(255,255,255,.92);
      --line: rgba(255,255,255,.14);
      --shadow: 0 30px 90px rgba(2,6,23,.32);
      --shadow2: 0 18px 54px rgba(2,6,23,.16);
      --r: 20px;
    }

    *{box-sizing:border-box}
    html,body{margin:0;padding:0}
    body{
      font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP","Hiragino Sans","Yu Gothic",Meiryo,system-ui,sans-serif;
      color:var(--ink);
      background:
        radial-gradient(900px 420px at 15% -5%, rgba(56,189,248,.28), transparent 60%),
        radial-gradient(1000px 520px at 90% 10%, rgba(59,130,246,.30), transparent 62%),
        linear-gradient(180deg, #050816, #0b1430 40%, #f6f8ff 140%);
      min-height:100vh;
    }

    .wrap{max-width:980px;margin:0 auto;padding:22px 16px 56px}

    /* top hero */
    .hero{
      border-radius: calc(var(--r) + 6px);
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
      font-size:30px;line-height:1.18;letter-spacing:-.02em;
    }
    .meta{
      display:flex;gap:10px;flex-wrap:wrap;align-items:center;
      font-size:12px;opacity:.92;
    }
    .dot{opacity:.6}
    .tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .tag{
      text-decoration:none;
      border:1px solid var(--line);
      background:rgba(255,255,255,.10);
      color:#fff;
      padding:6px 10px;border-radius:999px;
      font-size:12px;font-weight:800;
    }
    .tag:hover{background:rgba(255,255,255,.16)}
    .crumb{
      margin-top:14px;
      display:flex;gap:10px;flex-wrap:wrap;align-items:center;
    }
    .crumb a{
      color:rgba(255,255,255,.92);
      text-decoration:none;
      font-weight:800;
      border:1px solid var(--line);
      background:rgba(255,255,255,.08);
      padding:8px 12px;border-radius:14px;
    }
    .crumb a:hover{background:rgba(255,255,255,.14)}
    .crumb .ghost{opacity:.82}

    /* article card */
    .card{
      margin-top:-18px;
      border-radius: var(--r);
      background: var(--card);
      box-shadow: var(--shadow2);
      border:1px solid rgba(0,0,0,.06);
      overflow:hidden;
    }
    .content{padding:18px 18px 8px}
    .content p{line-height:1.92;color:rgba(11,18,32,.86);margin:12px 0}
    .content h2{
      margin:24px 0 10px;
      font-size:18px;
      letter-spacing:-.01em;
      padding-left:12px;
      border-left:4px solid rgba(59,130,246,.55);
    }
    .content h3{
      margin:18px 0 8px;
      font-size:15px;
      letter-spacing:-.01em;
    }
    .content ul{margin:10px 0 14px 18px;line-height:1.85}
    .content li{margin:6px 0}
    .content a{color:#0a5bd3;font-weight:900;text-decoration:none}
    .content a:hover{text-decoration:underline}
    .content hr{border:none;border-top:1px solid rgba(0,0,0,.08);margin:18px 0}

    .note{
      padding:14px 18px;
      border-top:1px solid rgba(0,0,0,.06);
      background: linear-gradient(180deg, rgba(10,91,211,.04), rgba(56,189,248,.03));
      color:rgba(11,18,32,.74);
      font-size:12px;
      line-height:1.7;
    }

    /* footer */
    .footer{
      margin-top:14px;
      display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;
      color:rgba(255,255,255,.72);
    }
    .footer a{color:rgba(255,255,255,.92);text-decoration:none;font-weight:900}

    /* subtle page actions (mobile friendly) */
    .bar{
      position:fixed;left:0;right:0;bottom:0;
      padding:10px 12px;
      background: rgba(5,8,22,.72);
      backdrop-filter: blur(10px);
      border-top:1px solid rgba(255,255,255,.12);
      display:flex;gap:10px;justify-content:center;
    }
    .btn{
      max-width:980px;flex:1;
      text-align:center;
      padding:12px 14px;border-radius:16px;
      background: linear-gradient(135deg,#0a2a63,#0a5bd3);
      color:#fff;text-decoration:none;font-weight:900;
      box-shadow: 0 18px 50px rgba(2,6,23,.28);
    }
    .btn:hover{opacity:.92}

    @media(min-width:900px){
      .h1{font-size:34px}
      .content{padding:22px 22px 10px}
      .note{padding:16px 22px}
      .bar{display:none} /* PCは固定CTA出さない */
    }
  </style>
</head>

<body>
  <div class="wrap">
    <header class="hero">
      <div class="heroInner">
        <div class="badge">SIN JAPAN Official Column</div>
        <h1 class="h1">${title}</h1>
        <div class="meta">
          <span>${isoDate}</span><span class="dot">•</span><span>${category}</span>
        </div>
        <div class="tags">${tagHtml}</div>

        <div class="crumb">
          <a href="https://sinjapanllc.github.io/sinjapan-column/" target="_blank" rel="noopener">コラム一覧へ</a>
          <span class="ghost">※記事は毎日自動更新</span>
        </div>
      </div>
    </header>

    <main class="card">
      <article class="content">
        ${bodyHtml}
      </article>
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
</body>
</html>`;
}
