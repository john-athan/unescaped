/**
 * Validate the store package before anybody uploads it: the dashboard's limits,
 * every file the extension names, and the claims the listing makes.
 *
 *   node scripts/check-package.mjs unescaped-0.1.0.zip
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const zip = resolve(process.argv[2] || `unescaped-${manifest.version}.zip`);

const listing = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' })
  .split('\n').map((s) => s.trim()).filter((n) => n && !n.endsWith('/'));

const problems = [];

if (manifest.name.length > 45) problems.push(`name is ${manifest.name.length} chars, limit 45`);
if (manifest.description.length > 132) problems.push(`description is ${manifest.description.length} chars, limit 132`);
if (!/^\d+(\.\d+){0,3}$/.test(manifest.version)) problems.push(`version "${manifest.version}" is not a valid extension version`);

for (const size of ['16', '32', '48', '128']) {
  const icon = manifest.icons?.[size];
  if (!icon) problems.push(`no ${size}px icon declared`);
  else if (!listing.includes(icon)) problems.push(`${size}px icon declared but not packed: ${icon}`);
}

// Everything the manifest, the service worker and the pages name has to be in
// the zip, or the extension installs and then fails where only the user sees it.
const named = new Set();
(function walk(v) {
  if (typeof v === 'string') { if (/\.(js|html|png)$/.test(v)) named.add(v); }
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
})(manifest);
for (const m of readFileSync('background.js', 'utf8').matchAll(/importScripts\(([^)]*)\)|url:\s*'([^']+\.html)'/g)) {
  for (const f of (m[1] ?? `'${m[2]}'`).matchAll(/'([^']+)'/g)) named.add(f[1]);
}
for (const page of listing.filter((n) => n.endsWith('.html'))) {
  for (const m of readFileSync(page, 'utf8').matchAll(/(?:src|href)="([^"]+\.(?:js|png))"/g)) named.add(m[1]);
}
for (const f of named) if (!listing.includes(f)) problems.push(`named but not packed: ${f}`);

const allowed = /^(manifest\.json|LICENSE|icons\/icon(16|32|48|128)\.png|(background|sources|viewer|sandbox)\.(js|html))$/;
for (const name of listing) if (!allowed.test(name)) problems.push(`unexpected file in the package: ${name}`);

// The listing says: no remote code, one network call (the Drive download), and
// the only HTML written anywhere is the user's own document, in the sandbox.
for (const name of listing.filter((n) => n.endsWith('.js'))) {
  const body = readFileSync(name, 'utf8');
  const rules = [
    [/\beval\s*\(|new\s+Function\s*\(/, 'eval'],
    [/\.innerHTML\s*=|insertAdjacentHTML/, 'HTML injection'],
    [/XMLHttpRequest|WebSocket|sendBeacon/, 'a network call'],
  ];
  if (name !== 'viewer.js') rules.push([/\bfetch\s*\(/, 'a network call outside the Drive download']);
  if (name !== 'sandbox.js') rules.push([/document\.write/, 'document.write outside the sandbox']);
  for (const [pattern, why] of rules) if (pattern.test(body)) problems.push(`${name} contains ${why}`);
  for (const url of body.match(/https?:\/\/[^\s'"`)]+/g) ?? []) {
    if (!/^https:\/\/drive\.google\.com\//.test(url)) problems.push(`${name} names a remote URL: ${url}`);
  }
}

console.log(`${listing.length} files packed, version ${manifest.version}`);
console.log(`  permissions: ${manifest.permissions.join(', ')}`);
console.log(`  hosts: ${manifest.host_permissions.join(', ')}`);
if (problems.length) {
  console.error('\nProblems:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('\nPackage looks acceptable to the store.');
