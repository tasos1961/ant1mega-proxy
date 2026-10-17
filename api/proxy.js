export default async function handler(req, res) {
    // CORS-Header für den Browser öffnen
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
        // Standard-Header für normale Webseiten
        let customHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'el-GR,el;q=0.9,en-US;q=0.8,en;q=0.7'
        };

        // Aggressivere Tarnung für den direkten M3U8 IPTV-Stream (Ant1free)
        if (url.includes('antennaplus.gr') || url.includes('.m3u8')) {
            customHeaders = {
                // Emuliert exakt ein typisches Android-basiertes IPTV-Gerät (wie deine Xiaomi Box)
                'User-Agent': 'PANASONIC-TV/2.0 (G20/Base) IPTV-Player/1.0 (Linux;Android 10)',
                'Accept': '*/*',
                'Accept-Language': 'el-GR,el;q=0.9',
                'Connection': 'keep-alive',
                'Origin': 'null',
                // Einige Server verlangen zwingend leere oder keine Referer bei IPTV-Direktaufrufen
                'Referer': ''
            };
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: customHeaders
        });

        // Wenn der Server mit 403 blockiert, versuchen wir einen schnellen Fallback ohne jegliche Header-Einschränkung
        if (response.status === 403 && url.includes('.m3u8')) {
            const fallbackResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'okhttp/3.12.12', // Standard-Netzwerkbibliothek von Android-Apps
                    'Accept': '*/*'
                }
            });
            
            if (fallbackResponse.ok) {
                const streamData = await fallbackResponse.text();
                res.setHeader('Content-Type', 'application/x-mpegURL');
                return res.status(200).send(streamData);
            }
        }

        if (!response.ok) {
            return res.status(response.status).send(`Server blockiert Zugriff: ${response.status} ${response.statusText}`);
        }

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
