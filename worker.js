// stockcurve Worker: static console + two small routes for the Launch page.
//   POST /rpc              → forwards JSON-RPC to the Helius endpoint (secret RPC_URL), so the key never reaches the browser
//   GET  /meta/dyn?s=&n=   → Metaplex-style metadata JSON for tokens launched from the page (generic stockcurve image)
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/rpc" && req.method === "POST") {
      const r = await fetch(env.RPC_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: await req.text() });
      return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    if (url.pathname === "/meta/dyn") {
      const s = (url.searchParams.get("s") || "sTOKEN").slice(0, 10), n = (url.searchParams.get("n") || `stockcurve ${s}`).slice(0, 32);
      const i = url.searchParams.get("i"), d = (url.searchParams.get("d") || "").slice(0, 200);
      const image = i && /^https:\/\/[^\s"']+\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(i) ? i : `${url.origin}/meta/stockcurve.png`;
      const body = { name: n, symbol: s, description: d || `${n}: a stock-quoted launch curve on Meteora DBC, launched from stockcurve.`, image, external_url: url.origin, properties: { category: "image", files: [{ uri: image, type: image.endsWith(".png") ? "image/png" : "image/jpeg" }] } };
      return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300" } });
    }
    return env.ASSETS.fetch(req);
  },
};
