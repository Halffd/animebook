import express from 'express';
import cors from 'cors';
import path from 'path';
import open from 'open';
/**
 * Retrieves and validates the port number from command-line arguments.
 * @param {number} [defaultPort=5555] - The default port number to use if no valid port is provided.
 * @returns {number} The validated port number.
 */
function getPort(defaultPort = 5555) {
  const portArg = process.argv[2];
  const parsedPort = parseInt(portArg, 10);

  if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
    return parsedPort;
  }

  console.log('Invalid port number. Using default port', defaultPort);
  return defaultPort;
}

/**
 * Registers static middleware for serving multiple folders.
 * @param {express.Application} app - The Express application.
 * @param {string[]} staticFolders - An array of folder paths to serve as static files.
 */
function registerStaticFolders(app, staticFolders) {
  staticFolders.forEach(folder => {
    const absolutePath = path.join(path.resolve(), folder);
    console.log(`/${folder} -> ${absolutePath}`);
    app.use(`/${folder}`, express.static(absolutePath));
  });
}

const app = express();

const corsOptions = {
  origin: '*',
};

app.use(cors(corsOptions));

// Array of folder paths to serve as static files
const staticFolders = ['','js','public','dict'];

// Register static middleware for the folders
registerStaticFolders(app, staticFolders);

// Read and validate the port number
const port = getPort();

// Start the server
app.listen(port, () => {
    const url = `http://localhost:${port}`
    console.log(`Server is running on ${url}`);
    open(url)
}); 
