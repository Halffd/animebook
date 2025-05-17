import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import helmet from 'helmet';
import open from 'open';

/** Base directory for video files (~/anm) */
const homeDir = process.env.HOME || process.env.USERPROFILE;
const baseVideoDir = path.join(homeDir, 'anm');
const publicDir = path.join(process.cwd(), 'public');

/**
 * Retrieves and validates the port number from command-line arguments.
 * @param {number} [defaultPort=5555]
 * @returns {number}
 */
function getPort(defaultPort = 5555) {
  const portArg = process.argv[2];
  const parsed = parseInt(portArg, 10);
  if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) return parsed;
  console.log('Invalid port, using default:', defaultPort);
  return defaultPort;
}

const app = express();

// Security headers via Helmet
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    mediaSrc: ["'self'", "blob:"], // 👈 Add this line
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'", 'data:'],
    connectSrc: ["'self'", 'ws:'],
    objectSrc: ["'none'"],
    scriptSrcElem: ["'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
  }
}));

const corsOptions = { origin: '*' };
app.use(cors(corsOptions));

const root = process.cwd();
// Serve static assets
app.use(express.static(root));
console.log(`${root} ${root}`);

// Serve video files under /videos
app.use('/videos', express.static(baseVideoDir));
console.log(`/videos -> ${baseVideoDir}`);

// Serve the video list UI
app.get('/dir', (req, res) => {
  res.sendFile(path.join(publicDir, 'videoList.html'));
});

/**
 * GET /api/videos?path=<relative>
 * Lists files and folders under ~/anm/<relative>
 */
app.get('/api/videos', async (req, res) => {
  const rel = req.query.path || '';
  // normalize and remove any leading ../
  const safe = path.normalize(rel).replace(/^([.]{2}(\/|\\|$))+/, '');
  const dir = path.join(baseVideoDir, safe);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const videos = await Promise.all(entries.map(async ent => {
      const full = path.join(dir, ent.name);
      const stat = await fs.stat(full);
      return {
        name: ent.name,
        path: path.posix.join(rel, ent.name),
        size: stat.size,
        lastModified: stat.mtimeMs,
        isDirectory: ent.isDirectory()
      };
    }));
    res.json({ videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cannot read directory' });
  }
});

// Fallback for SPA routing or missing pages
app.use((req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// Start server
const port = getPort();
app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Server listening: ${url}`);
  // open(url);
});
