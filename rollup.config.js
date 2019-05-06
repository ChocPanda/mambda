import path from 'path';

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import license from 'rollup-plugin-license';

const plugins = [
	resolve(),
	commonjs(),
	license({
		banner: {
			file: path.join(__dirname, 'LICENSE')
		}
	})
];

export default [
	{
		input: 'src/lambda.js',
		output: {
			file: 'dist/index.js',
			format: 'cjs',
			preferConst: true,
			exports: 'default'
		},
		external: ['http-errors'],
		plugins
	},
	// Middlewares
	{
		input: {
			'json-body-parser': 'src/middlewares/json-body-parser/middleware.js'
		},
		output: {
			dir: 'dist/middlewares/',
			entryFileNames: '[name]/index.js',
			format: 'cjs',
			preferConst: true,
			exports: 'named'
		},
		external: ['http-errors'],
		plugins
	},
	{
		input: 'src/middlewares/index.js',
		output: {
			file: 'dist/middlewares/index.js',
			format: 'cjs',
			preferConst: true,
			exports: 'named'
		},
		external: ['http-errors'],
		plugins
	}
];
