export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
        const response = await fetch("https://68085673-13e8-4de1-83e1-6853336c14df-00-2pszcu51sso9d.kirk.replit.dev?type=getredirect");
        if (!response.ok) throw new Error("Bad response");

        const text = await response.text();
        res.status(200).send(text.trim() || "none");
    } catch (err) {
        res.status(200).send("none");
    }
}
