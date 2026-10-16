export default async function handler(req, res) {
  try {
    const target = req.query.url;

    if (!target || !target.startsWith("http")) {
      res.statusCode = 400;
      return res.end("Missing or invalid ?url=");
    }

    const response = await fetch(target, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "el-GR,el;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    // 1. Alle Header vom Ziel-Server kopieren
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // 2. CORS-Header für deinen Proxy setzen
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");

    // 3. Iframe-Sperren entfernen
    res.setHeader("X-Frame-Options", "ALLOWALL"); 
    res.removeHeader("content-security-policy");
    res.removeHeader("content-security-policy-report-only");

    const contentType = response.headers.get("content-type") || "";

    // 4. HTML-Inhalte verarbeiten und Pfade korrigieren
    if (contentType.includes("text/html")) {
      let html = await response.text();
      
      const urlObj = new URL(target);
      const baseUrl = urlObj.origin;

      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head><base href="${baseUrl}/">`);
      } else if (html.includes("<HEAD>")) {
        html = html.replace("<HEAD>", `<HEAD><base href="${baseUrl}/">`);
      }

      res.statusCode = 200;
      return res.end(html);
    }

    // 5. Andere Dateitypen (Bilder, Skripte) als Buffer senden
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.statusCode = 200;
    return res.end(buffer);

  } catch (err) {
    res.statusCode = 500;
    return res.end("Proxy failed: " + err.message);
  }
}
