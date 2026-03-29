import { diffWords } from 'diff';

export interface ChangeAnalysis {
  summary: string;
  category: 'pricing' | 'feature' | 'content' | 'seo' | 'design' | 'other';
  importance: 'critical' | 'important' | 'medium' | 'minor';
  insight: string;
  changes: string[];
}

function preprocessDiff(oldText: string, newText: string): string {
  const changes = diffWords(oldText, newText);
  const meaningful: string[] = [];

  for (const part of changes) {
    if (!part.added && !part.removed) continue;
    const text = part.value.trim();
    if (text.length < 5) continue;
    if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(text)) continue;
    if (/^\d+$/.test(text)) continue;
    const prefix = part.added ? '[ADDED]' : '[REMOVED]';
    meaningful.push(`${prefix} ${text}`);
  }

  return meaningful.join('\n');
}

const SYSTEM_PROMPT = `You are a competitive intelligence analyst. You analyze changes on competitor websites and provide actionable insights.

Given the diff of a webpage, you must:
1. Summarize what changed in 2-3 clear sentences
2. Categorize the change (pricing/feature/content/seo/design/other)
3. Rate importance (critical/important/medium/minor)
4. Provide a business insight — what does this change mean strategically?
5. List specific changes as bullet points

Respond in valid JSON format only:
{
  "summary": "...",
  "category": "pricing|feature|content|seo|design|other",
  "importance": "critical|important|medium|minor",
  "insight": "...",
  "changes": ["...", "..."]
}

Rules:
- Be specific: "Pricing changed from $29 to $39" not "Pricing was updated"
- Be actionable: Tell the user what this means for their business
- Category "pricing" = any pricing/plan/tier changes
- Category "feature" = new features, removed features, product updates
- Category "content" = blog posts, case studies, testimonials, copy changes
- Category "seo" = title/meta/heading/URL changes
- Category "design" = layout/visual changes (usually "minor")
- If changes are trivial (only whitespace, timestamps, counters), set importance to "minor"`;

export async function analyzeChange(
  url: string,
  oldText: string,
  newText: string,
): Promise<ChangeAnalysis> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.aigocode.com';
  const model = process.env.AI_MODEL || 'claude-sonnet-4-6';

  if (!apiKey) {
    return {
      summary: `Changes detected on ${new URL(url).hostname}. AI analysis requires API key.`,
      category: 'other',
      importance: 'medium',
      insight: 'Configure AI_API_KEY for AI-powered analysis.',
      changes: ['Content has been modified'],
    };
  }

  const diff = preprocessDiff(oldText, newText);

  if (diff.length < 10) {
    return {
      summary: 'Minor changes detected (likely formatting or timestamps).',
      category: 'other',
      importance: 'minor',
      insight: 'No significant content changes.',
      changes: ['Minor text formatting changes'],
    };
  }

  // OpenAI-compatible API call
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `URL: ${url}\n\nChanges detected:\n${diff.slice(0, 4000)}` },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]) as ChangeAnalysis;
  } catch {
    return {
      summary: text.slice(0, 200),
      category: 'other',
      importance: 'medium',
      insight: 'AI analysis completed but response parsing failed.',
      changes: ['See summary for details'],
    };
  }
}
