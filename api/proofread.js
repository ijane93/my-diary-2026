export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
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
            content: 'You are a professional English writing tutor and proofreader. Please proofread and improve the following English diary entry. Fix all grammar, spelling, and punctuation errors. Improve sentence structure and word choice for more natural English. Keep the original meaning and tone. Make it sound like a native English speaker wrote it. Return ONLY the corrected text, nothing else.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'AI service error' });
    }

    const proofreadText = data.choices?.[0]?.message?.content || text;
    return res.status(200).json({ proofreadText });

  } catch (error) {
    return res.status(500).json({ error: 'Proofread failed' });
  }
}
