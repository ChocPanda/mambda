const test = require('ninos')(require('ava'));
const {
	normalizePreExecutionMiddleware,
	normalizePostExecutionMiddleware,
	normalizeErrorExecutionMiddleware,
	reduceMiddlewares
} = require('../utils');

/**
 * Normalize Pre-Execution Middlewares
 */

const preExecutionTestMacro = async (
	t,
	middleware,
	expectedEvent,
	expectedContext
) => {
	const normalizedMiddleware = normalizePreExecutionMiddleware(middleware);
	const middlewareResult = await normalizedMiddleware('event', 'context');

	t.deepEqual(middlewareResult, [expectedEvent, expectedContext]);
};

preExecutionTestMacro.title = inputDesc =>
	`Pre-Execution middlewares returning - ${inputDesc} - should be normalized to return an array with the event and context`;

[
	{
		desc: 'an array with a new event and context',
		middleware: () => ['new event', 'new context'],
		expectedEvent: 'new event',
		expectedContext: 'new context'
	},
	{
		desc: 'an array with a new event but no context',
		middleware: () => ['new event'],
		expectedEvent: 'new event',
		expectedContext: 'context'
	},
	{
		desc: 'a new event and no context',
		middleware: () => 'new event',
		expectedEvent: 'new event',
		expectedContext: 'context'
	},
	{
		desc: 'an empty array with no event or context',
		middleware: () => [],
		expectedEvent: 'event',
		expectedContext: 'context'
	},
	{
		desc: 'void',
		middleware: () => {},
		expectedEvent: 'event',
		expectedContext: 'context'
	}
].forEach(({ desc, middleware, expectedEvent, expectedContext }) =>
	test(desc, preExecutionTestMacro, middleware, expectedEvent, expectedContext)
);

/**
 * Normalize Post-Execution Middlewares
 */

const postExecutionTestMacro = async (t, middleware, expectedArgs) => {
	const normalizedMiddleware = normalizePostExecutionMiddleware(middleware);
	const middlewareResult = await normalizedMiddleware(
		'result',
		'event',
		'context'
	);

	t.deepEqual(middlewareResult, expectedArgs);
};

postExecutionTestMacro.title = inputDesc =>
	`Post-Execution middlewares - returning ${inputDesc} - should be normalized to return an array with the result, event and context`;

[
	{
		desc: 'an array with a new result with an updated event and context',
		middleware: () => ['new result', 'new event', 'new context'],
		expectedResult: 'new result',
		expectedEvent: 'new event',
		expectedContext: 'new context'
	},
	{
		desc: 'an array with a new result',
		middleware: () => ['new result'],
		expectedResult: 'new result',
		expectedEvent: 'event',
		expectedContext: 'context'
	},
	{
		desc: 'a new result',
		middleware: () => 'new result',
		expectedResult: 'new result',
		expectedEvent: 'event',
		expectedContext: 'context'
	},
	{
		desc: 'an empty array with no event or context',
		middleware: () => [],
		expectedResult: 'result',
		expectedEvent: 'event',
		expectedContext: 'context'
	},
	{
		desc: 'void',
		middleware: () => {},
		expectedResult: 'result',
		expectedEvent: 'event',
		expectedContext: 'context'
	}
].forEach(
	({ desc, middleware, expectedResult, expectedEvent, expectedContext }) =>
		test(desc, postExecutionTestMacro, middleware, [
			expectedResult,
			expectedEvent,
			expectedContext
		])
);

/**
 * Normalize Error-Execution Middlewares
 */

const errorExecutionTestMacro = async (t, middleware, expectedArgs) => {
	const normalizedMiddleware = normalizeErrorExecutionMiddleware(middleware);
	const middlewareResult = await normalizedMiddleware(
		'result',
		'error',
		'event',
		'context'
	);

	t.deepEqual(middlewareResult, expectedArgs);
};

errorExecutionTestMacro.title = inputDesc =>
	`Error-Execution middlewares - returning ${inputDesc} - should be normalized to return an array with the transformed error and result`;

[
	{
		desc: 'an array with a result, transformed error, event and context',
		middleware: () => ['new result', 'new error', 'new event', 'new context'],
		expectedResult: 'new result',
		expectedError: 'new error',
		expectedEvent: 'new event',
		expectedContext: 'new context'
	},
	{
		desc:
			'an array with an unchanged result, transformed error but event or context',
		middleware: res => [res, 'new error'],
		expectedResult: 'result',
		expectedError: 'new error',
		expectedEvent: 'event',
		expectedContext: 'context'
	},
	{
		desc: 'a new result',
		middleware: () => 'new result',
		expectedResult: 'new result',
		expectedError: 'error',
		expectedEvent: 'event',
		expectedContext: 'context'
	},
	{
		desc: 'an empty array with no error or result',
		middleware: () => [],
		expectedResult: 'result',
		expectedError: 'error',
		expectedEvent: 'event',
		expectedContext: 'context'
	},
	{
		desc: 'void',
		middleware: () => {},
		expectedResult: 'result',
		expectedError: 'error',
		expectedEvent: 'event',
		expectedContext: 'context'
	}
].forEach(
	({
		desc,
		middleware,
		expectedResult,
		expectedError,
		expectedEvent,
		expectedContext
	}) =>
		test(desc, errorExecutionTestMacro, middleware, [
			expectedResult,
			expectedError,
			expectedEvent,
			expectedContext
		])
);

/**
 * Reduce Middlewares
 */

const createTestMiddlewares = fn => [
	{ numMiddlewares: 1, createMiddlewares: t => [t.context.stub(fn)] },
	{
		numMiddlewares: 2,
		createMiddlewares: t => Array.from({ length: 2 }, () => t.context.stub(fn))
	},
	{
		numMiddlewares: 5,
		createMiddlewares: t => Array.from({ length: 5 }, () => t.context.stub(fn))
	}
];

const identityFn = (...args) => args;
const testIdentityMiddlewares = createTestMiddlewares(identityFn);

const executeAllMiddlewaresTestMacro = async (
	t,
	createStubMiddlewares,
	normalizer,
	args
) => {
	const stubMiddlewares = createStubMiddlewares(t);
	const middlewares = stubMiddlewares.map(normalizer);
	await reduceMiddlewares({ middlewares })(...args);

	const middlewareCalls = stubMiddlewares.map(
		stubMiddleware => stubMiddleware.calls
	);
	const expectedCalls = Array.from({ length: stubMiddlewares.length }, () => [
		{
			arguments: args,
			return: args,
			this: undefined
		}
	]);

	t.deepEqual(middlewareCalls, expectedCalls);
};

testIdentityMiddlewares
	.map(testParams => ({
		normalizer: normalizePreExecutionMiddleware,
		...testParams
	}))
	.forEach(({ numMiddlewares, createMiddlewares, normalizer }) =>
		test(
			`Reduce middlewares - should execute all Pre-Execution Middlewares when there are ${numMiddlewares} middlewares`,
			executeAllMiddlewaresTestMacro,
			createMiddlewares,
			normalizer,
			['event', 'context']
		)
	);

testIdentityMiddlewares
	.map(testParams => ({
		normalizer: normalizePostExecutionMiddleware,
		...testParams
	}))
	.forEach(({ numMiddlewares, createMiddlewares, normalizer }) =>
		test(
			`Reduce middlewares - should execute all Post-Execution Middlewares when there are ${numMiddlewares} middlewares`,
			executeAllMiddlewaresTestMacro,
			createMiddlewares,
			normalizer,
			['result', 'event', 'context']
		)
	);

const incrementFn = i => i + 1;
const executionOrderTestMacro = async (t, normalizer, args) => {
	const stubMiddlewares = [
		t.context.stub(() => 1),
		t.context.stub(incrementFn),
		t.context.stub(() => 3)
	];
	const middlewares = stubMiddlewares.map(normalizer);
	await reduceMiddlewares({ middlewares })(...args);

	const middlewareCalls = stubMiddlewares.map(
		stubMiddleware => stubMiddleware.calls
	);
	const expectedCalls = [
		[{ arguments: args, return: 1, this: undefined }],
		[{ arguments: [1, ...args.slice(1)], return: 2, this: undefined }],
		[{ arguments: [2, ...args.slice(1)], return: 3, this: undefined }]
	];

	t.deepEqual(middlewareCalls, expectedCalls);
};

test(
	'Reduce middlewares - should execute all Pre-Execution Middlewares in order',
	executionOrderTestMacro,
	normalizePreExecutionMiddleware,
	['event', 'context']
);

test(
	'Reduce middlewares - should execute all Post-Execution Middlewares in order',
	executionOrderTestMacro,
	normalizePostExecutionMiddleware,
	['result', 'event', 'context']
);
