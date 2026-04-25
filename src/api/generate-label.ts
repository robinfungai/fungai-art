export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, protocol_name } = req.body;

    // Check for OpenAI API key
    const apiKey = process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Call DALL-E 3 API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('DALL-E API error:', error);
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    return res.status(200).json({
      image_url: imageUrl,
      protocol_name,
      message: 'Label generated successfully',
    });
  } catch (error) {
    console.error('Error in generate-label:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
