const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
function versionAssets(html) {
  return html.replace(/(src|href)="([\w./-]+\.(?:js|css))(?:\?[^"\s]*)?"/g, (_, attribute, file) => {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
    const version = createHash('sha256').update(source).digest('hex').slice(0, 12);
    return `${attribute}="${file}?v=${version}"`;
  });
}
module.exports = versionAssets;
if (require.main === module) {
  const file = path.join(__dirname, 'index.html');
  const html = fs.readFileSync(file, 'utf8'), updated = versionAssets(html);
  if (process.argv.includes('--check')) {
    if (html !== updated) throw new Error('Run node version-assets.cjs before publishing changed scripts or styles.');
  } else fs.writeFileSync(file, updated);
}
