export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const fallbackUrl = "https://www.twitch.tv/blueryai/clip/SpikySullenGorillaBCWarrior-do8Vyd1JqKGUpQEv";
    const clipApi = "https://4b646c79-7d89-477b-af11-791e5a27cd07-00-1pxopkbkgfwrk.worf.replit.dev?type=getfeaturedclip";

    try {
        // 1. Get the clip URL from your Replit API
        const response = await fetch(clipApi);
        if (!response.ok) throw new Error("Bad response");
        const clipUrl = (await response.text()).trim() || fallbackUrl;

        // 2. Extract Twitch clip ID from URL
        let clipId = null;
        if (clipUrl.includes("/clip/")) {
            clipId = clipUrl.split("/clip/").pop();
        }

        let title = "Featured Clip";

        // 3. Query Twitch API if we got a clip ID
        if (clipId) {
            try {
                const twitchRes = await fetch(`https://api.twitch.tv/helix/clips?id=${clipId}`, {
                    headers: {
                        "Client-ID": process.env.TWITCH_CLIENT_ID,   // set in Vercel env vars
                        "Authorization": `Bearer ${process.env.TWITCH_TOKEN}` // app access token
                    }
                });

                if (twitchRes.ok) {
                    const data = await twitchRes.json();
                    if (data.data && data.data.length > 0) {
                        title = data.data[0].title;
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch Twitch clip metadata:", err);
            }
        }

        // 4. Return JSON with both URL and title
        res.status(200).json({
            url: clipUrl,
            title
        });
    } catch (err) {
        res.status(200).json({
            url: fallbackUrl,
            title: "Featured Clip"
        });
    }
}
