import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "public";
const FEED_PATH = path.join(OUT_DIR, "feed", "index.json");
fs.mkdirSync(path.dirname(FEED_PATH), { recursive: true });

// 日付
const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth()+1).padStart(2,"0");
const d = String(now.getDate()).padStart(2,"0");
const date = `${y}-${m}-${d}`;

// キーワード在庫を読む（曜日で分散）
const KEYWORDS = JSON.parse(fs.readFileSync("keywords.json","utf8"));
const dayIndex = (now.getDay()+6)%7; // 月=0..日=6
const pick = KEYWORDS[dayIndex][Math.floor(Math.random()*KEYWORDS[dayIndex].length)];

// 出力先パス
const slug = `${y}/${m}/${pick.slug}-${date}.html`;
const outPath = path.join(OUT_DIR, slug);
fs.mkdirSync(path.dirname(outPath), { recursive: true });

// 記事本文（まずはテンプレ）
const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escape(pick.title)}｜SIN JAPAN公式コラム</title>
<meta name="description" content="${escape(pick.description)}"/>
<link rel="canonical" href="/${slug}"/>
<style>
 body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP","Yu Gothic",sans-serif;margin:0}
 .wrap{max-width:860px;margin:0 auto;padding:20px}
 .meta{opacity:.7;font-size:12px;margin:8px 0 16px}
 h1{margin:0;font-size:28px}
 h2{margin-top:22px}
 .cta{margin-top:28px;padding:14px;border:1px solid rgba(0,0,0,.12);border-radius:12px;background:#fafafa}
</style>
</head>
<body>
<main class="wrap">
  <h1>${escape(pick.title)}</h1>
  <div class="meta">${date} / ${escape(pick.category)}</div>

  <h2>結論</h2>
  <p>${escape(pick.lead)}</p>

  <h2>実務ポイント</h2>
  <ul>
    <li>目的と前提条件を先に明文化する</li>
    <li>条件分岐（例外処理）を手順に組み込む</li>
    <li>KPIで運用を監査する</li>
  </ul>

  <h2>見落としがちなリスク</h2>
  <p>制度・契約・運用の前提が揃っていないと、現場でコストや手戻りが発生する。</p>

  <h2>チェックリスト</h2>
  <ol>
    <li>ゴール（何を達成するか）は明確か</li>
    <li>失敗条件（どこで止めるか）は定義したか</li>
    <li>第三者に引き継げる手順か</li>
  </ol>

  <div class="cta">
    <strong>ご相談・お問い合わせ</strong><br/>
    <a href="https://sinjapan.work">SIN JAPAN 公式サイト</a>
  </div>
</main>
</body>
</html>`;

fs.writeFileSync(outPath, html, "utf8");

// feed 更新
let feed = [];
if (fs.existsSync(FEED_PATH)) {
  feed = JSON.parse(fs.readFileSync(FEED_PATH,"utf8"));
}
feed = [{
  title: pick.title,
  slug,
  date,
  category: pick.category,
  description: pick.description,
  tags: pick.tags
}, ...feed.filter(x => x.slug !== slug)].slice(0,500);

fs.writeFileSync(FEED_PATH, JSON.stringify(feed,null,2), "utf8");

console.log("Generated:", slug);

function escape(s){
  return String(s??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
// sitemap.xml 生成（Googleに更新を拾わせる）
const SITE_BASE = "https://sinjapanllc.github.io/sinjapan-column/public/";

const urls = feed.map(a => {
  return `  <url>
    <loc>${SITE_BASE}${a.slug}</loc>
    <lastmod>${a.date}</lastmod>
  </url>`;
}).join("\n");

const sitemapXml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), sitemapXml, "utf8");
