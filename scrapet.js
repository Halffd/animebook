import fetch from "node-fetch";
import { JSDOM } from "jsdom";

async function searchAniDB(title) {
  const res = await fetch(
    `https://anidb.net/search/fulltext/?adb.search=${encodeURIComponent(title)}&do.search=1`
  );

  const html = await res.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const links = [...doc.querySelectorAll(".search_results a")].map(a => ({
    title: a.textContent.trim(),
    url: "https://anidb.net" + a.getAttribute("href")
  }));

  return links;
}
let a = await searchAniDB("frieren")
console.log(a)
