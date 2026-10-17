export default async function handler(req, res) {
    // CORS für deinen Browser öffnen
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
        // Die exakte Tarnung des VLC Media Players
        const vlcHeaders = {
            'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
            'Accept': '*/*',
            'Connection': 'close' // VLC hält Verbindungen oft nicht offen
        };

        const response = await fetch(url, {
            method: 'GET',
            headers: vlcHeaders
        });

        if (!response.ok) {
            return res.status(response.status).send(`ANT1 meldet Fehler: ${response.status}`);
        }

        // Wenn es eine M3U8-Liste ist, schreiben wir die Pfade für den Player um
        if (url.includes('.m3u8')) {
            let text = await response.text();
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            const proxyBase = `https://${req.headers.host}/api/proxy?url=`;

            const lines = text.split('\n');
            const processedLines = lines.map(line => {
                line = line.trim();
                if (line.length === 0 || line.startsWith('#')) {
                    return line;
                }
                if (!line.startsWith('http')) {
                    return proxyBase + encodeURIComponent(baseUrl + line);
                }
                return proxyBase + encodeURIComponent(line);
            });

            res.setHeader('Content-Type', 'application/x-mpegURL');
            return res.status(200).send(processedLines.join('\n'));
        } else {
            // Rohdaten der Videosegmente (.ts) wie VLC streamen
            const arrayBuffer = await response.arrayBuffer();
            res.setHeader('Content-Type', response.headers.get('content-type') || 'video/MP2T');
            return res.status(200).send(Buffer.from(arrayBuffer));
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
