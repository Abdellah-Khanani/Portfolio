// Writes sitemap.xml into the assembled site from js/projects.js, so every project the
// Studio dashboard publishes is listed without anyone touching this file.
const fs = require('fs');
const dir = process.argv[2] || '_site';
const w = {};
new Function('window', fs.readFileSync(`${dir}/js/projects.js`, 'utf8'))(w);
const base = 'https://ak-design.it/';
const pages = ['', 'work.html', 'bts.html', 'contact.html']
  .concat((w.PROJECTS || []).filter(p => !p.hidden && p.slug).map(p => `project.html?p=${encodeURIComponent(p.slug)}`));
const esc = s => s.replace(/&/g, '&amp;');
fs.writeFileSync(`${dir}/sitemap.xml`,
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map(p => `  <url><loc>${esc(base + p)}</loc></url>`).join('\n') + '\n</urlset>\n');
console.log(`sitemap: ${pages.length} pages`);
