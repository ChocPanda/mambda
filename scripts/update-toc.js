const { resolve } = require('path');
const { ls, exec } = require('shelljs');

const tocCmd = 'yarn markdown-toc --no-firsth1 --bullets="-"';

exec(`${tocCmd} -i ${resolve('./README.md')}`);

ls('-R', 'src')
	.filter(path => path.includes('README'))
	.forEach(readme => exec(`${tocCmd} -i ${resolve('src', readme)}`));
