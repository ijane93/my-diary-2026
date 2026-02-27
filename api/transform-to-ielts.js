 // api/transform-to-ielts.js
// ============================================================
// IELTS Band 7 Rewriting Serverless Function
// ============================================================
//
// This function receives the user's original diary text,
// sends it to DeepSeek API with a carefully crafted prompt,
// and returns an IELTS Band 7+ rewritten version.
//
// LLM Prompt Strategy:
// ---------------------
// SYSTEM MESSAGE:
//   Instructs the AI to act as an IELTS writing examiner and tutor.
//   Sets clear rules: improve vocabulary/collocations, use complex
//   grammar, maintain logical paragraph structure, preserve all
//   facts/names/product names, and output ONLY the rewritten text.
//
// USER MESSAGE:
//   Simply passes the original diary text to be rewritten.
//
// The system prompt is designed to hit all four IELTS Band 7 criteria:
//   - Task Achievement (preserve meaning, add detail)
//   - Coherence & Cohesion (clear paragraphs, linking words)
//   - Lexical Resource (varied vocabulary, collocations)
//   - Grammatical Range & Accuracy (complex structures, accuracy)
//
// API Contract:
//   POST /api/transform-to-ielts
//   Request:  { "text": "I go to store yesterday..." }
//   Response: { "ielts7Text": "Yesterday, I visited the store..." }
// ============================================================

export default async function handler(req, res) {
  // --- CORS headers (allow browser to call this endpoint) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request from browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract text from request body
  const { text } = req.body || {};
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty text' });
  }

  // Read API key from environment variable (secure, never exposed to browser)
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // --- System prompt: carefully designed for IELTS Band 7 rewriting ---
  const systemPrompt = `You are an expert IELTS writing examiner and English tutor. Your task is to rewrite the user's diary entry to meet IELTS Writing Band 7 standards.

Follow these rules strictly:

1. VOCABULARY & COLLOCATIONS:
   - Replace simple/basic words with more sophisticated alternatives
   - Use natural English collocations (e.g., "make progress" not "do progress")
   - Use a wide range of vocabulary appropriate to the topic
   - Avoid repetition of words; use synonyms and paraphrases

2. GRAMMAR & SENTENCE STRUCTURE:
   - Use a mix of simple, compound, and complex sentences
   - Include relative clauses, conditional sentences, and participial phrases
   - Ensure subject-verb agreement, correct tense usage, and proper articles
   - Use passive voice where appropriate for variety

3. COHERENCE & COHESION:
   - Organize into clear logical paragraphs
   - Use linking words and cohesive devices (Furthermore, In addition, However, As a result, etc.)
   - Ensure smooth transitions between ideas
   - Each paragraph should have a clear topic

4. CONTENT PRESERVATION (CRITICAL):
   - Keep ALL original facts, events, dates, and details
   - Do NOT invent any new information
   - Preserve ALL proper nouns: person names, product names, company names, place names
   - Do NOT translate or change any domain-specific terms or technical nouns
   - Keep the first-person perspective

5. OUTPUT FORMAT:
   - Return ONLY the rewritten text
   - Do NOT include any explanations, notes, scores, or commentary
   - Do NOT add headers like "Rewritten version:" or similar
   - Just output the improved diary text directly`;

  try {
    // --- Call DeepSeek API ---
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please rewrite the following diary entry to IELTS Band 7 standard:\n\n${text}`
          }
        ],
        // Low temperature for consistent, accurate output
        temperature: 0.4,
        max_tokens: 2500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('DeepSeek API error:', JSON.stringify(data));
      return res.status(500).json({ error: 'AI service error' });
    }

    // Extract the rewritten text from DeepSeek response
    const ielts7Text = data.choices?.[0]?.message?.content?.trim() || text;

    // Return the result
    return res.status(200).json({ ielts7Text });

  } catch (error) {
    console.error('Transform to IELTS failed:', error);
    return res.status(500).json({ error: 'Transform failed' });
  }
}
