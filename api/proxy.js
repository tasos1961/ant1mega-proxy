export default async function handler(req, res) {
  try {
    const target = req.query.url;

    if (!target || !target.startsWith("http")) {
      return res.status(400).send("Missing or invalid ?url=");
    }

    const response = await fetch(target, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Headers"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET,HEAD,OPTIONS";

    if (headers["content-type"]?.includes("text")) {
      const text = await response.text();
      return res.set(headers).send(text);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return res.set(headers).send(buffer);

  } catch (err) {
    return res.status(500).send("Proxy failed: " + err.message);
  }
}
