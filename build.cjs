// Static deploy package. No dependencies or installation required.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
const files = ['index.html', 'app.js', 'audio.js', 'style.css', 'retro.css', 'mobile.css', 'navigation.css', 'motion.css', 'audio.css', 'mobile-layout.css', 'competition.css', 'theme.css', 'eighties.css', 'theme.js', 'standings.js', 'config.js', 'database.js', 'organizer.js', 'competition.js'];
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(out, file));
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
console.log('Site ready in dist/');
