// scripts/generate.mjs
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const FEED_DIR = path.join(PUBLIC_DIR, "feed");
const FEED_JSON = path.join(FEED_DIR, "index.json");
const ARTICLES_DIR = path.join(FEED_DIR, "articles");
const SITE_BASE = "https://sinjapanllc.github.io/sinjapan-column/"; // Pagesのルート
const CANON_BASE = SITE_BASE; // canonicalも同じでOK

const CATEGORIES = [
  "軽貨物",
  "一般貨物",
  "トラック手配",
  "３PL",
  "車両レンタル",
  "資金調達",
  "代理店",
  "BPO",
  "人材紹介",
  "システム開発",
  "プラットフォーム開発",
  "アプリ開発",
  "WEB制作",
  "IT補助金",
  "ライブ配信",
  "SEOマーケティング",
  "SNSマーケティング",
  "AIOマーケティング",
  "不動産",
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJsonSafe(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
}

function ymd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toIso(date = new Date()) {
  return ymd(date);
}

function slugifyHint(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/\-+/g, "-")
    .slice(0, 80) || "article";
}

// 超軽量Markdown→HTML（依存なし）
function mdToHtml(md = "") {
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const lines = String(md).split("\n");
  const out = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) out.push("</ul>"), (inUl = false);
    if (inOl) out.push("</ol>"), (inOl = false);
  };

  for (let raw of lines) {
    const line = raw.replace(/\r/g, "");

    // hr
    if (/^\s*---\s*$/.test(line)) {
      closeLists();
      out.push("<hr/>");
      continue;
    }

    // headings
    if (/^###\s+/.test(line)) {
      closeLists();
      out.push(`<h3>${esc(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      closeLists();
      out.push(`<h2>${esc(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      if (inUl) out.push("</ul>"), (inUl = false);
      if (!inOl) out.push("<ol>"), (inOl = true);
      out.push(`<li>${inline(esc(line.replace(/^\s*\d+\.\s+/, "")))}</li>`);
      continue;
    }

    // unordered list
    if (/^\s*[\-\*]\s+/.test(line)) {
      if (inOl) out.push("</ol>"), (inOl = false);
      if (!inUl) out.push("<ul>"), (inUl = true);
      out.push(`<li>${inline(esc(line.replace(/^\s*[\-\*]\s+/, "")))}</li>`);
      continue;
    }

    // blockquote
    if (/^\s*>\s+/.test(line)) {
      closeLists();
      out.push(`<blockquote>${inline(esc(line.replace(/^\s*>\s+/, "")))}</blockquote>`);
      continue;
    }

    // blank
    if (/^\s*$/.test(line)) {
      closeLists();
      continue;
    }

    // paragraph
    closeLists();
    out.push(`<p>${inline(esc(line))}</p>`);
  }

  closeLists();
  return out.join("\n");

  function inline(s) {
    // code
    s = s.replace(/`([^`]+)`/g, (_, a) => `<code>${a}</code>`);
    // bold
    s = s.replace(/\*\*([^*]+)\*\*/g, (_, a) => `<strong>${a}</strong>`);
    // link (markdown)
    s = s.replace(/$begin:math:display$([^$end:math:display$]+)\]$begin:math:text$([^)]+)$end:math:text$/g, (_, text, url) => {
      const safeUrl = url.replace(/"/g, "%22");
      return `<a href="${safeUrl}" target="_blank" rel="noopener">${text}</a>`;
    });
    return s;
  }
}

function wrapHtml({
  title,
  description,
  bodyHtml,
  isoDate,
  category,
  tags,
  canonicalUrl,
  related = [],
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
    .h1{margin:10px 0 10px;font-size:34px;line-height:1.16;letter-spacing:-.02em;}
    .meta{display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-size:12px;opacity:.92;}
    .dot{opacity:.6}
    .tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .tag{
      border:1px solid var(--line);
      background:rgba(255,255,255,.10);
      color:#fff;
      padding:6px 10px;border-radius:999px;
      font-size:12px;font-weight:900;
    }
    .crumb{margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
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

    .card{
      margin-top:-18px;
      border-radius: var(--r);
      background: var(--card);
      box-shadow: var(--shadow2);
      border:1px solid rgba(0,0,0,.06);
      overflow:hidden;
    }

    .content{
      max-width:var(--read);
      margin:0 auto;
      padding:26px 22px 10px;
    }
    .content p{line-height:2.0;letter-spacing:.02em;color:rgba(11,18,32,.86);margin:14px 0;font-size:15px;}
    .content h2{
      margin:34px 0 14px;font-size:20px;
      padding:8px 12px;border-left:6px solid rgba(59,130,246,.75);
      background:linear-gradient(90deg, rgba(10,91,211,.10), transparent);
      border-radius:12px;
    }
    .content h3{margin:22px 0 10px;font-size:16px;}
    .content ul, .content ol{
      margin:14px 0 18px;
      padding:14px 18px 14px 32px;
      background:#f6f8ff;
      border:1px solid rgba(0,0,0,.05);
      border-radius:14px;
      line-height:1.9;
    }
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
      padding:2px 6px;border-radius:8px;font-weight:900;
    }

    .relWrap{max-width:var(--read);margin:8px auto 0;padding:0 22px 18px}
    .relGrid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:10px}
    .relCard{
      display:block;text-decoration:none;color:inherit;
      border:1px solid rgba(0,0,0,.06);
      background:#fff;border-radius:16px;padding:14px;
    }
    .relTitle{font-weight:1000}
    .relMeta{margin-top:6px;font-size:12px;color:rgba(11,18,32,.62);font-weight:900}
    .relDesc{margin-top:8px;font-size:13px;color:rgba(11,18,32,.78);line-height:1.7}

    .note{
      padding:14px 18px;
      border-top:1px solid rgba(0,0,0,.06);
      background: linear-gradient(180deg, rgba(10,91,211,.04), rgba(56,189,248,.03));
      color:rgba(11,18,32,.74);
      font-size:12px;line-height:1.7;
    }

    .footer{
      margin-top:14px;
      display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;
      color:rgba(255,255,255,.72);
    }
    .footer a{color:rgba(255,255,255,.92);text-decoration:none;font-weight:900}

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
      color:#fff;text-decoration:none;font-weight:1000;
      box-shadow: 0 18px 50px rgba(2,6,23,.28);
    }
    .btn:hover{opacity:.92}

    @media(min-width:900px){
      .bar{display:none}
      .relGrid{grid-template-columns:1fr 1fr}
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
          <span>${esc(isoDate)}</span><span class="dot">•</span><span>${esc(category)}</span>
        </div>
        <div class="tags">${tagHtml}</div>

        <div class="crumb">
          <a href="${SITE_BASE}" target="_blank" rel="noopener">コラム一覧へ</a>
          <span class="ghost">※記事は毎日自動更新</span>
        </div>
      </div>
    </header>

    <main class="card">
      <article class="content">
        ${bodyHtml}
      </article>

      ${
        relatedHtml
          ? `<div class="relWrap">
              <div style="font-weight:1000;color:rgba(11,18,32,.76);">関連記事</div>
              <div class="relGrid">${relatedHtml}</div>
            </div>`
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
    // 目次（h2を拾う・無いなら何もしない）
    (function(){
      const h2s = Array.from(document.querySelectorAll(".content h2"));
      if(!h2s.length) return;
      h2s.forEach((h,i)=>{ if(!h.id) h.id = "h2-"+(i+1); });

      const wrap = document.createElement("div");
      wrap.style.maxWidth = "var(--read)";
      wrap.style.margin = "18px auto 0";
      wrap.style.padding = "0 22px";

      const toc = document.createElement("div");
      toc.className = "toc";
      toc.innerHTML = '<div class="tocTop"><div class="tocTitle">目次</div><button class="tocBtn" type="button">開く</button></div><ul class="tocList" style="display:none;"></ul>';
      wrap.appendChild(toc);

      const list = toc.querySelector(".tocList");
      h2s.forEach(h=>{
        const li = document.createElement("li");
        li.innerHTML = '<a href="#'+h.id+'">'+h.textContent+'</a>';
        list.appendChild(li);
      });

      const btn = toc.querySelector(".tocBtn");
      btn.addEventListener("click", ()=>{
        const open = list.style.display === "none";
        list.style.display = open ? "block" : "none";
        btn.textContent = open ? "閉じる" : "開く";
      });

      const card = document.querySelector(".card");
      card.insertBefore(wrap, card.firstChild);
    })();
  </script>
</body>
</html>`;
}

function buildRelated(feed, currentSlug) {
  const cur = feed.find((x) => x.slug === currentSlug);
  const sameCat = cur?.category;
  const related = feed
    .filter((x) => x.slug !== currentSlug)
    .filter((x) => (sameCat ? x.category === sameCat : true))
    .slice(0, 6)
    .map((x) => ({
      title: x.title,
      url: CANON_BASE + x.slug.replace(/^\//, ""),
      date: x.date,
      category: x.category,
      description: x.description,
    }));
  return related;
}

function updateFeed(feed, item) {
  const key = item.slug;
  const next = [item, ...feed.filter((x) => x.slug !== key)];
  // date desc
  next.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return next.slice(0, 300); // 上限（無限肥大防止）
}

function writeSitemap(feed) {
  ensureDir(PUBLIC_DIR);
  const urls = feed.map((x) => `${CANON_BASE}${x.slug.replace(/^\//, "")}`);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u}</loc>
  </url>`
  )
  .join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), body, "utf8");
}

// ===== OpenAI =====
function requireApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY が未設定です（GitHub Actions secretsに設定してね）");
  }
  return key;
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

async function aiGenerateArticleJSON({ category, isoDate }) {
  requireApiKey();

  const prompt = `
あなたはSIN JAPAN公式コラムの編集長。SEOで勝ち、問い合わせに繋がる実務記事を作る。

【カテゴリ】${category}
【公開日】${isoDate}

【出力】JSONのみ（他の文章禁止）
{
  "title": "32字前後。検索意図に刺さる断定タイトル",
  "description": "80〜110字のメタ説明",
  "tags": ["${category}", "関連タグ2〜5個"],
  "slugHint": "英数字とハイフンのみ",
  "bodyMarkdown": "1500〜2200字。H2/H3。チェックリスト/見積テンプレ/KPI必須"
}

【必須ブロック】
- チェックリスト（7〜12項目）
- 見積依頼テンプレ（箇条書き）
- 運用KPI（3〜6個）
- 注意：契約/法務/税務は一般論で免責

生成せよ。
`.trim();

  const res = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const text = res.output_text || "";
  return JSON.parse(text);
}

// ===== CLI =====
function parseArgs(argv) {
  const args = { all: false, n: 1, category: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") args.all = true;
    if (a === "--n") args.n = Math.max(1, parseInt(argv[i + 1] || "1", 10) || 1), i++;
    if (a === "--category") args.category = argv[i + 1] || null, i++;
  }
  return args;
}

function articlePathFromSlug(slug) {
  return path.join(PUBLIC_DIR, slug.replace(/^\//, ""));
}

function sourceJsonPathFromSlug(slug) {
  // 2026/02/xxx.html -> public/feed/articles/2026/02/xxx.json
  const p = slug.replace(/\.html$/, ".json");
  return path.join(ARTICLES_DIR, p);
}

async function renderOneFromSource({ slug, source, feed }) {
  const bodyHtml = mdToHtml(source.bodyMarkdown || "");
  const canonicalUrl = CANON_BASE + slug.replace(/^\//, "");
  const related = buildRelated(feed, slug);

  const html = wrapHtml({
    title: source.title,
    description: source.description,
    bodyHtml,
    isoDate: source.date,
    category: source.category,
    tags: source.tags || [source.category],
    canonicalUrl,
    related,
  });

  const outPath = articlePathFromSlug(slug);
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, html, "utf8");
  return outPath;
}

async function generateNew({ category, isoDate, feed }) {
  const j = await aiGenerateArticleJSON({ category, isoDate });

  const slugHint = slugifyHint(j.slugHint || category);
  const y = isoDate.slice(0, 4);
  const m = isoDate.slice(5, 7);
  const slug = `${y}/${m}/${slugHint}-${isoDate}.html`;

  const source = {
    title: j.title,
    description: j.description,
    tags: Array.from(new Set([category, ...(j.tags || [])])).slice(0, 12),
    category,
    date: isoDate,
    slug,
    bodyMarkdown: j.bodyMarkdown,
  };

  // 元データ保存（これが “--all” の根拠）
  writeJson(sourceJsonPathFromSlug(slug), source);

  // HTML出力
  const outPath = await renderOneFromSource({ slug, source, feed });

  // feed item
  const item = {
    title: source.title,
    slug: source.slug,
    date: source.date,
    category: source.category,
    description: source.description,
    tags: source.tags,
  };

  return { outPath, item, source };
}

async function main() {
  ensureDir(FEED_DIR);
  ensureDir(ARTICLES_DIR);

  const args = parseArgs(process.argv.slice(2));
  const isoDate = toIso(new Date());

  let feed = readJsonSafe(FEED_JSON, []);
  if (!Array.isArray(feed)) feed = [];

  // --all: 保存済みsource jsonから “全再レンダー”
  if (args.all) {
    // feedに載ってるslugを全走査し、sourceがあれば再レンダー
    for (const it of feed) {
      const slug = it.slug;
      const srcPath = sourceJsonPathFromSlug(slug);
      const source = readJsonSafe(srcPath, null);
      if (!source) continue; // 過去分でsource無いものはスキップ（今後は作られる）
      await renderOneFromSource({ slug, source, feed });
    }
    writeSitemap(feed);
    console.log("Rebuilt all (only items with saved sources).");
    return;
  }

  const n = args.n || 1;

  for (let i = 0; i < n; i++) {
    const category =
      args.category ||
      CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    const { outPath, item } = await generateNew({ category, isoDate, feed });

    feed = updateFeed(feed, item);
    console.log("Generated:", item.slug);
  }

  writeJson(FEED_JSON, feed);
  writeSitemap(feed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
