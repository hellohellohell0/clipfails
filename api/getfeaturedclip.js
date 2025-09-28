export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Fallback in case Replit API fails
    const fallback = {
        url: "https://www.twitch.tv/blueryai/clip/SpikySullenGorillaBCWarrior-do8Vyd1JqKGUpQEv",
        title: "Featured Clip"
    };

    try {
        // Fetch from your Replit endpoint
        const response = await fetch("https://68085673-13e8-4de1-83e1-6853336c14df-00-2pszcu51sso9d.kirk.replit.dev?type=getfeaturedclip");
        if (!response.ok) throw new Error("Bad response");

        const text = await response.text();
        
        // Assume Replit endpoint now returns text like: "URL|Title"
        const [url, title] = text.trim().split("|");

        res.status(200).json({
            url: url || fallback.url,
            title: title || fallback.title
        });
    } catch (err) {
        res.status(200).json(fallback);
    }
}
