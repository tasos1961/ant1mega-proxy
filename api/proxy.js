export default async function handler(req, res) {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("url");

    if (!target) {
        return res.status(400).send("Missing ?url=");
    }

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "*/*",
        "Accept-Language": "el-GR,el;q=0.9,en;q=0.8",
        "X-Forwarded-For": "2.84.1.22",
        "CF-IPCountry": "GR",
        "Referer": target,
        "Origin": null
    };

    const response = await fetch(target, {
        method: req.method,
        headers,
        redirect: "follow"
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Headers", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");

    if (target.endsWith(".m3u8")) {
        let text = await response.text();
        text = text.replace(/(https?:\/\/[^ ]+)/g, (match) => {
            return `/proxy?url=${encodeURIComponent(match)}`;
        });
        return res.set(Object.fromEntries(newHeaders)).send(text);
    }

    const buffer = await response.arrayBuffer();
    res.set(Object.fromEntries(newHeaders)).send(Buffer.from(buffer));
}
