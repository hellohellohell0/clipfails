export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
  
    const webhookUrl = process.env.DISCORD_WEBHOOK;
  
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
  
      if (!response.ok) throw new Error('Discord webhook failed');
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: 'Failed to send message' });
    }
}