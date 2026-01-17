import { JSDOM } from "jsdom";
import { fetchHtml } from "../utils/fetchHtml.js";

export async function searchAnime(title) {
  const html = await fetchHtml(
    `https://anidb.net/search/fulltext/?adb.search=${encodeURIComponent(title)}&do.search=1`
  );

  const doc = new JSDOM(html).window.document;

  return [...doc.querySelectorAll(".search_results tr")]
    .map(tr => {
      const link = tr.querySelector("a[href^='/anime/']");
      if (!link) return null;

      return {
        id: link.getAttribute("href").split("/").pop(),
        title: link.textContent.trim() || link.getAttribute('title'),
        url: "https://anidb.net" + link.getAttribute("href")
      };
    })
    .filter(Boolean);
}
