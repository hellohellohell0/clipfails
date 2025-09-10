export default async function handler(req, res) {
    const { message } = req.body;
  
    await fetch(process.env.DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  
    res.status(200).json({ status: "ok" });
  }
