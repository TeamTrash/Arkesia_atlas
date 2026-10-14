const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { placeCatalog } = require('./places.js');

const LANGUAGES = ['ES', 'EN', 'KR'];
const AUDIO_TYPES = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac', '.opus': 'audio/ogg', '.webm': 'audio/webm' };
const STATIC_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', ...AUDIO_TYPES };
const PUBLIC_FILES = new Set(['index.html', 'styles.css', 'places.js', 'app.js', 'music.js', 'clouds.js']);

function folderName(place) {
  return place.name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/, '');
}
function inside(root, file) {
  const relative = path.relative(root, file);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
async function initializeSongs(root = __dirname) {
  for (const place of Object.values(placeCatalog)) {
    for (const language of LANGUAGES) await fsp.mkdir(path.join(root, 'songs', folderName(place), language), { recursive: true });
  }
}
async function listTracks(root, id, language) {
  const place = placeCatalog[id];
  if (!place || !LANGUAGES.includes(language)) return null;
  const folder = folderName(place);
  const directory = path.join(root, 'songs', folder, language);
  let entries;
  try {
    const real = await fsp.realpath(directory);
    if (!inside(root, real)) throw new Error('Invalid song directory');
    entries = await fsp.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return { folder: `songs/${folder}/${language}`, tracks: [] };
    throw error;
  }
  const tracks = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))) {
    if (!entry.isFile() || !AUDIO_TYPES[path.extname(entry.name).toLowerCase()]) continue;
    const stat = await fsp.stat(path.join(directory, entry.name));
    if (!stat.size) continue;
    const url = ['songs', folder, language, entry.name].map(encodeURIComponent).join('/');
    tracks.push({ title: path.basename(entry.name, path.extname(entry.name)), src: `/${url}?v=${stat.size}-${stat.mtimeMs}` });
  }
  return { folder: `songs/${folder}/${language}`, tracks };
}
function sendJson(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
function createServer(root = __dirname) {
  root = fs.realpathSync(root);
  return http.createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/tracks') {
        const result = await listTracks(root, url.searchParams.get('place'), url.searchParams.get('language'));
        sendJson(res, result ? 200 : 400, result || { error: 'Lugar o idioma inválido.' });
        return;
      }
      let relative;
      try { relative = decodeURIComponent(url.pathname).slice(1) || 'index.html'; }
      catch { res.writeHead(400); res.end(); return; }
      if (relative.includes('\\') || relative.includes('\0') || relative.split('/').includes('..')) { res.writeHead(403); res.end(); return; }
      const ext = path.extname(relative).toLowerCase();
      const allowed = PUBLIC_FILES.has(relative) || (relative.startsWith('assets/') && ext === '.png') || (relative.startsWith('songs/') && AUDIO_TYPES[ext]);
      if (!allowed) { res.writeHead(404); res.end(); return; }
      const file = await fsp.realpath(path.join(root, relative));
      if (!inside(root, file)) { res.writeHead(403); res.end(); return; }
      const stat = await fsp.stat(file);
      if (!stat.isFile()) { res.writeHead(404); res.end(); return; }
      let start = 0, end = stat.size - 1, status = 200;
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return; }
        start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
        end = match[1] ? (match[2] ? Math.min(Number(match[2]), end) : end) : end;
        if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return; }
        status = 206;
      }
      const headers = { 'Content-Type': STATIC_TYPES[ext] || 'application/octet-stream', 'Content-Length': Math.max(0, end - start + 1), 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
      if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      res.writeHead(status, headers);
      if (req.method === 'HEAD' || !stat.size) { res.end(); return; }
      const stream = fs.createReadStream(file, { start, end });
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } catch (error) {
      if (!res.headersSent) sendJson(res, error.code === 'ENOENT' ? 404 : 500, { error: 'No se pudo leer el archivo.' });
      else res.destroy();
    }
  });
}
if (require.main === module) {
  initializeSongs().then(() => {
    if (process.argv.includes('--init')) { console.log('Carpetas songs preparadas.'); return; }
    const port = Number(process.env.ATLAS_PORT || 4175);
    const server = createServer();
    server.on('error', error => { console.error(`No se pudo iniciar el atlas: ${error.message}`); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Arkesia Atlas: http://127.0.0.1:${port}\nMantén esta ventana abierta. Ctrl+C para detener.`));
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { createServer, initializeSongs, listTracks, folderName };
