import path from 'path';

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import license from 'rollup-plugin-license';
import copy from 'rollup-plugin-copy';
import json from 'rollup-plugin-json';
import builtins from 'builtin-modules';
import sourcemaps from 'rollup-plugin-sourcemaps';

const plugins = [
	sourcemaps(),
	json({}),
	resolve({
		preferBuiltins: true,
		external: ['aws-sdk']
	}),
	commonjs(),
	license({
		banner: {
			file: path.join(__dirname, 'LICENSE')
		}
	}),
	copy({
		targets: [
			{
				src: ['*.md', 'package.json'],
				dest: 'dist'
			},
			{
				src: 'src/middlewares/**/*.README.md',
				dest: 'dist',
				rename: name => `middlewares/${name.split('.')[0]}/README.md`
			}
		]
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
		external: builtins.concat(["http-errors", "aws-sdk"]),
		plugins
	},
	// Middlewares
	{
		input: {
			'json-body-parser': 'src/middlewares/json-body-parser/middleware.js',
			'http-error-handler': 'src/middlewares/http-error-handler/middleware.js',
			'http-header-normalizer':
				'src/middlewares/http-header-normalizer/middleware.js',
			'ssm-param-resolver':
				'src/middlewares/ssm-param-resolver/middleware.js'
		},
		output: {
			dir: 'dist/middlewares/',
			entryFileNames: '[name]/index.js',
			format: 'cjs',
			preferConst: true,
			exports: 'named'
		},
		external: builtins.concat(["http-errors", "aws-sdk"]),
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
		external: builtins.concat(["http-errors", "aws-sdk"]),
		plugins
	},
	// tests
	{
		input: 'integration-tests/src/middlewares/ssm-param-resolver/lambda-with-ssm-param-resolver.js',
		output: {
			file: 'integration-tests/dist/index.js',
			format: 'cjs',
			preferConst: true,
			exports: 'named',
			sourceMap: true
		},
		// TODO Their must be a 
		external: builtins.concat(["aws-sdk"]),
		plugins
	}
];
