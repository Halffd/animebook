import fetch from "node-fetch";

export async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "anm-player/1.0 (local use)",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status}`);
  }

  // be polite
  await new Promise(r => setTimeout(r, 800));

  return res.text();
}
