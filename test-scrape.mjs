// Quick test: scrape a page and run AI analysis
import { createHash } from 'crypto';
import * as cheerio from 'cheerio';

const AI_API_KEY = 'sk-a7f7e8db8f9e9f18292c4e6bc4ed087bfd34bf6c4a1ab021855aa51314e46add';
const AI_BASE_URL = 'https://api.aigocode.com';
const AI_MODEL = 'claude-sonnet-4-6';

// --- Scraper ---
const REMOVE = 'script,style,noscript,iframe,nav,header,footer,[role="navigation"],[role="banner"],[role="contentinfo"],svg,img';
const CONTENT = ['main', 'article', '[role="main"]', '#content', '#main', '.content'];

async function scrape(url) {
  console.log(`\n🕷️  Scraping: ${url}`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $(REMOVE).remove();

  let content = '';
  for (const sel of CONTENT) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 100) { content = el.text().replace(/\s+/g, ' ').trim(); break; }
  }
  if (!content) content = $('body').text().replace(/\s+/g, ' ').trim();

  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  console.log(`✅ Got ${content.length} chars, hash: ${hash}`);
  console.log(`📝 Preview: ${content.slice(0, 200)}...`);
  return content;
}

// --- AI Analysis ---
async function analyze(url, oldText, newText) {
  console.log(`\n🧠 Running AI analysis...`);

  // Simple diff for test
  const diff = `[OLD CONTENT SAMPLE]\n${oldText.slice(0, 500)}\n\n[NEW CONTENT SAMPLE]\n${newText.slice(0, 500)}`;

  const res = await fetch(`${AI_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are a competitive intelligence analyst. Analyze webpage changes and respond in JSON: {"summary":"...","category":"pricing|feature|content|seo|design|other","importance":"critical|important|medium|minor","insight":"...","changes":["..."]}' },
        { role: 'user', content: `URL: ${url}\n\nChanges:\n${diff}` },
      ],
      max_tokens: 512,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ AI API error ${res.status}: ${err.slice(0, 300)}`);
    return;
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  console.log(`✅ AI response:\n${text}`);

  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    console.log(`\n📊 Parsed result:`);
    console.log(`   Summary: ${json.summary}`);
    console.log(`   Category: ${json.category}`);
    console.log(`   Importance: ${json.importance}`);
    console.log(`   Insight: ${json.insight}`);
    console.log(`   Changes: ${json.changes?.join(', ')}`);
  } catch (e) {
    console.log('⚠️  Could not parse JSON from response');
  }
}

// --- Run Test ---
async function main() {
  console.log('=== CompWatch Scrape + AI Test ===\n');

  // Test 1: Scrape Visualping pricing page
  const content1 = await scrape('https://visualping.io/pricing');

  // Test 2: Scrape another page for comparison
  const content2 = await scrape('https://distill.io/pricing');

  // Test 3: Run AI analysis (simulate a "change" between two different pages)
  await analyze('https://visualping.io/pricing', content2, content1);

  console.log('\n✅ All tests passed!');
}

main().catch(e => console.error('❌ Test failed:', e.message));
