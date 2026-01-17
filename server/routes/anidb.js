import express from "express";
import { searchAnime } from "../services/anidbSearch.js";
import { fetchEpisodes } from "../services/anidbEpisodes.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing query" });

    res.json(await searchAnime(q));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/episodes/:id", async (req, res) => {
  try {
    res.json(await fetchEpisodes(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
