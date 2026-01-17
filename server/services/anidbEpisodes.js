import { JSDOM } from "jsdom";
import { fetchHtml } from "../utils/fetchHtml.js";

export async function fetchEpisodes(animeId) {
  const html = await fetchHtml(`https://anidb.net/anime/${animeId}`);
  const doc = new JSDOM(html).window.document;

  return [...doc.querySelectorAll("#eplist tbody tr")]
    .map(tr => {
      const num = tr.querySelector("[itemprop='episodeNumber']")?.textContent.trim();
      const dateCell = tr.querySelector("td.airdate");
      const iso = dateCell?.getAttribute("content");

      if (!num || !iso) return null;

      return {
        episode: num,
        airDate: iso,          // yyyy-mm-dd (perfect for you)
        type: tr.classList.contains("newtype") ? "special" : "regular"
      };
    })
    .filter(Boolean);
}
