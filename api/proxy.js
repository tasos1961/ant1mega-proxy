export default async function handler(req, res) {
    // 1. CORS-Header setzen, damit dein Browser die Daten annehmen darf
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
        // Standard-Header für normale Webseiten (Ant1 HD & Mega)
        let customHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        };

        // Spezial-Fall: Wenn der direkte M3U8 IPTV-Stream von Ant1 aufgerufen wird
        if (url.includes('antennaplus.gr') && url.includes('.m3u8')) {
            customHeaders = {
                // Tarnt den Vercel-Server als eine erlaubte IPTV-App (Xiaomi/MAG Box)
                'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 imini netfront/3.4.1',
                'Referer': 'https://antenna.gr',
                'Accept': '*/*'
            };
        }

        // Anfrage an den Zielserver senden
        const response = await fetch(url, {
            method: 'GET',
            headers: customHeaders
        });

        if (!response.ok) {
            return res.status(response.status).send(`Server-Fehler: ${response.statusText}`);
        }

        // Unterscheiden, ob wir eine Webseite oder ein Video zurückgeben
        if (url.includes('.m3u8')) {
            const streamData = await response.text();
            res.setHeader('Content-Type', 'application/x-mpegURL');
            return res.status(200).send(streamData);
        } else {
            const htmlData = await response.text();
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(htmlData);
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
