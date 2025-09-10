export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
        const response = await fetch("https://4b646c79-7d89-477b-af11-791e5a27cd07-00-1pxopkbkgfwrk.worf.replit.dev?type=getredirect");
        if (!response.ok) throw new Error("Bad response");

        const text = await response.text();
        res.status(200).send(text.trim() || "none");
    } catch (err) {
        res.status(200).send("none");
    }
}
