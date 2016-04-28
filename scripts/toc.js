const toc = require('markdown-toc');
const fs = require('fs');
const path = require('path');

console.log(toc(
  fs.readFileSync(path.resolve(__dirname, '../README.md'), 'utf8'),
  {
    firsth1: false,
    maxdepth: 3,
    bullets: ['-', '1.', '*']
  }
).content);
