export default async function handler(req, res) {
  try {
    const target = req.query.url;

    if (!target || !target.startsWith("http")) {
      return res.status(400).send("Missing or invalid ?url=");
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

    const proxyHeaders = {};
    response.headers.forEach((value, key) => {
      proxyHeaders[key] = value;
    });

    proxyHeaders["Access-Control-Allow-Origin"] = "*";
    proxyHeaders["Access-Control-Allow-Headers"] = "*";
    proxyHeaders["Access-Control-Allow-Methods"] = "GET,HEAD,POST,OPTIONS";

    if (proxyHeaders["content-type"] && proxyHeaders["content-type"].includes("text")) {
      const text = await response.text();
      return res.set(proxyHeaders).send(text);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return res.set(proxyHeaders).send(buffer);

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).send("Proxy failed");
  }
}
