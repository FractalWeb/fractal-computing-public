// Local preview of the fractal-computing.com pages:  npm install, then  npm run preview  and open http://localhost:8080
//
// The live site renders each page with EJS on every request, the same way this does, so what you see here is what the site shows.
// Edit the files in site/ and reload the browser; no restart needed.

import ejs           from 'ejs'
import fs            from 'node:fs/promises'
import http          from 'node:http'
import path          from 'node:path'
import {fileURLToPath} from 'node:url'

const SITE    = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site')
const PORT    = Number(process.env.PORT) || 8080
const sectors = () => fs.readFile(path.join(SITE, 'data/markets.json'), 'utf8').then(JSON.parse)   // re-read each time, so edits show on reload

const PAGES = {                                                                  // URL -> page, as on the live site
    '/':           'index.html',
    '/index':      'index.html',
    '/why':        'why.html',
    '/how':        'how.html',
    '/about':      'about.html',
    '/markets':    'markets.html',
    '/benchmarks': 'benchmarks.html',
    '/contact':    'contact.html',
    '/working':    'working.html',
}

const TYPES = {'.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.woff2': 'font/woff2'}

async function render (res, file, env={}) {
    let html = await ejs.renderFile(path.join(SITE, file), {env: {nonce: '', ...env}, argv: {}})
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}).end(html)
}

async function handle (req, res) {
    let url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/+$/, '') || '/'

    if (url === '/api/contact') return res.writeHead(200, {'Content-Type': 'application/json'}).end('{"msg":"preview: not sent"}')   // the form shows its confirmation; nothing is sent

    if (PAGES[url])           return await render(res, PAGES[url], (url === '/markets') ? {sectors: await sectors()} : {})

    let m = url.match(/^\/markets\/([^/]+)$/)                                    // one industry, from data/markets.json
    if (m) {
	let sector = (await sectors()).find(s => s.slug.toLowerCase() === m[1].toLowerCase())
	if (sector) return await render(res, 'market.html', {sector})
    }

    if (url.startsWith('/apps/')) {                                              // stylesheets, scripts and images: /apps/<file> is site/<file>
	let file = path.join(SITE, url.slice('/apps/'.length))
	if (file.startsWith(SITE + path.sep) && TYPES[path.extname(file).toLowerCase()]) {
	    try   {return res.writeHead(200, {'Content-Type': TYPES[path.extname(file).toLowerCase()]}).end(await fs.readFile(file))}
	    catch {}
	}
    }

    res.writeHead(404, {'Content-Type': 'text/plain'}).end(`Not in this copy of the site: ${url}`)   // eg. /working/nda: the agreements aren't included
}

http.createServer((req, res) => handle(req, res).catch(e => {
    console.error(e)
    res.writeHead(500, {'Content-Type': 'text/plain'}).end(`Could not render the page:\n\n${e.message}`)   // usually an EJS mistake in the page being edited
})).listen(PORT, () => console.log(`Preview at http://localhost:${PORT}`))
