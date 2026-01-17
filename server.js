import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import helmet from 'helmet';
import open from 'open';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });
import fsExtra from 'fs-extra';

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

import anidbRoutes from './server/routes/anidb.js';

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

app.use("/api/anidb", anidbRoutes);

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Content-Range'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Content-Type'],
  credentials: true
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON and urlencoded request bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const root = process.cwd();
// Serve static assets
app.use(express.static(root));
console.log(`${root} ${root}`);

// Serve video files under /videos with proper headers for streaming
app.use('/videos', (req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, express.static(baseVideoDir, {
  // Enable range requests for video streaming
  setHeaders: (res, path) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'video/mp4');
    
    // Set cache control headers (1 day)
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

console.log(`Serving videos from: ${baseVideoDir}`);

// Ensure the video directory exists
fs.mkdir(baseVideoDir, { recursive: true })
  .then(() => console.log(`Video directory ready: ${baseVideoDir}`))
  .catch(err => console.error('Error creating video directory:', err));

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
// File upload endpoint
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const targetPath = req.body.path ? path.join(baseVideoDir, req.body.path) : baseVideoDir;
    
    // Ensure target directory exists
    await fs.mkdir(targetPath, { recursive: true });
    
    // Move each file to the target directory
    const results = await Promise.all(req.files.map(async (file) => {
      const targetFile = path.join(targetPath, file.originalname);
      await fs.rename(file.path, targetFile);
      return { 
        filename: file.originalname,
        path: path.relative(baseVideoDir, targetFile).replace(/\\/g, '/')
      };
    }));
    
    res.json({ success: true, files: results });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

// Cleanup temporary files on server start
fsExtra.emptyDirSync(uploadsDir);

// Fallback for SPA routing or missing pages
app.use((req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// Start server
const port = getPort(3000); // Default to port 3000
app.listen(port, '0.0.0.0', () => {
  const url = `http://localhost:${port}`;
  console.log(`Server listening: ${url}`);
  // Uncomment the line below to automatically open the browser
  // open(url);
});
