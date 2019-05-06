const test = require('ava-env')(require('ninos')(require('ava')));
const { createHttpError } = require('../../utils');
const middleware = require('../middleware');

test('Http Error Handling Middleware - Should handle http-errors by transforming the response', t => {
	const error = createHttpError(404, `Couldn't find any bugs`);
	const { onError: objUnderTest } = middleware();

	t.snapshot(objUnderTest(undefined, error, 'event', 'context'));
});

test('Http Error Handling Middleware - Should handle non-http-errors by transforming the response if there is a default status code', t => {
	const error = new Error(`Couldn't find any bugs`);
	const { onError: objUnderTest } = middleware({ defaultStatus: 500 });

	t.snapshot(objUnderTest(undefined, error, 'event', 'context'));
});

test('Http Error Handling Middleware - Should not handle non-http-errors if there is no default status code', t => {
	const error = new Error(`Couldn't find any bugs`);
	const { onError: objUnderTest } = middleware({ defaultStatus: null });

	t.snapshot(objUnderTest(undefined, error, 'event', 'context'));
});

test('Http Error Handling Middleware - Should not include stack traces in production builds', t => {
	const error = new Error(`Couldn't find any bugs`);
	const { onError: objUnderTest } = middleware();
	t.context.env({ NODE_ENV: 'production' });

	t.snapshot(objUnderTest(undefined, error, 'event', 'context'));
});

test('Http Error Handling Middleware - Should handle include stack traces in dev builds', t => {
	const error = new Error(`Couldn't find any bugs`);
	const { onError: objUnderTest } = middleware();
	t.context.env({ NODE_ENV: 'production' });

	t.snapshot(objUnderTest(undefined, error, 'event', 'context'));
});
