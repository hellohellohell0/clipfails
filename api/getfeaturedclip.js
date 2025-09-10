export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Fallback in case Replit API fails
    const fallback = {
        url: "https://www.twitch.tv/blueryai/clip/SpikySullenGorillaBCWarrior-do8Vyd1JqKGUpQEv",
        title: "Featured Clip"
    };

    try {
        // Fetch from your Replit endpoint
        const response = await fetch("https://4b646c79-7d89-477b-af11-791e5a27cd07-00-1pxopkbkgfwrk.worf.replit.dev?type=getfeaturedclip");
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
