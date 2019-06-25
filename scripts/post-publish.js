const fs = require('fs');

// destination will be created or overwritten by default.
fs.copyFile('./dist/package.json', './package.json', (err) => {
  if (err) throw err;
  console.log('Copied updated package.json');
});

fs.copyFile('./dist/CHANGELOG.md', 'CHANGELOG.md', (err) => {
  if (err) throw err;
  console.log('Copied updated CHANGELOG');
});