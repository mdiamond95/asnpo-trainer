// Turns the single-file build into a page body for a claude.ai preview (the host adds its own <html>/<head>/<body>).
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-single/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
const keep = [
  ...head.matchAll(/<title>[\s\S]*?<\/title>|<link\s+rel="stylesheet"[^>]*>|<link rel="preconnect"[^>]*>|<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g),
].map((m) => m[0]);
// Title first so the host finds it in the first 8 KB.
keep.sort((a, b) => (a.startsWith('<title') ? -1 : b.startsWith('<title') ? 1 : 0));
writeFileSync(process.argv[2] ?? 'dist-single/preview.html', `${keep.join('\n')}\n${body.trim()}\n`);
