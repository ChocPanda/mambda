const test = require('ninos')(require('ava'));
const lambda = require('../lambda');

/**
 * The Wrapped lambda function - Init
 */
test('Wrapped lambda function - should run the init function', async t => {
	const stubInit = t.context.stub(() => 'shared resource');
	const stubHandler = t.context.stub();
	const stubInitialiser = t.context.stub(() => stubHandler);
	const stubCallback = t.context.stub();

	const lambdaFunc = lambda({ init: stubInit, handler: stubInitialiser });

	await lambdaFunc('event', 'context', stubCallback);

	t.deepEqual(stubInit.calls, [
		{ this: undefined, arguments: [], return: 'shared resource' }
	]);
	t.deepEqual(stubInitialiser.calls, [
		{ this: undefined, arguments: ['shared resource'], return: stubHandler }
	]);

	t.snapshot(stubHandler.calls);
});

test('Wrapped lambda function - should cache the result of the init function', async t => {
	const stubInit = t.context.stub(() => 'shared resource');
	const stubHandler = t.context.stub();
	const stubInitialiser = t.context.stub(() => stubHandler);
	const stubCallback = t.context.stub();

	const lambdaFunc = lambda({ init: stubInit, handler: stubInitialiser });

	await lambdaFunc('event', 'context', stubCallback);
	await lambdaFunc('event', 'context', stubCallback);

	t.deepEqual(stubInit.calls, [
		{ this: undefined, arguments: [], return: 'shared resource' }
	]);
	t.deepEqual(stubInitialiser.calls, [
		{ this: undefined, arguments: ['shared resource'], return: stubHandler }
	]);

	t.snapshot(stubHandler.calls);
});

test('Wrapped lambda function - does not require an init function', async t => {
	const stubHandler = t.context.stub();
	const stubCallback = t.context.stub();

	const lambdaFunc = lambda({ handler: stubHandler });

	await lambdaFunc('event', 'context', stubCallback);

	t.snapshot(stubHandler.calls);
});

test('Wrapped lambda function - accepts a function parameter', async t => {
	const stubHandler = t.context.stub();
	const stubCallback = t.context.stub();

	const lambdaFunc = lambda(stubHandler);

	await lambdaFunc('event', 'context', stubCallback);

	t.snapshot(stubHandler.calls);
});

/**
 * The Wrapped lambda function - Middlewares
 */
[1, 3].forEach(numMiddlewares =>
	test(`Wrapped lambda function - should execute ${numMiddlewares} pre-execution middlewares and the handler`, async t => {
		const stubHandler = t.context.stub();
		const stubCallback = t.context.stub();
		const stubMiddlewares = Array.from({ length: numMiddlewares }, () => ({
			before: t.context.stub()
		}));

		const lambdaFunc = lambda({
			handler: stubHandler,
			middlewares: stubMiddlewares
		});

		await lambdaFunc('event', 'context', stubCallback);

		stubMiddlewares.forEach(({ before }) => t.snapshot(before.calls));
		t.snapshot(stubHandler.calls);
	})
);

test('Wrapped lambda function - should rethrow exceptions from pre-execution middlewares if there are no error handlers', async t => {
	const stubHandler = t.context.stub();
	const stubCallback = t.context.stub();
	const stubMiddlewares = [
		{
			before: () => {
				throw new Error('bang');
			}
		}
	];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});

	await t.throwsAsync(lambdaFunc('event', 'context', stubCallback), {
		instanceOf: Error,
		message: 'bang'
	});

	t.deepEqual(stubHandler.calls, []);
});

test('Wrapped lambda function - should rethrow exceptions from pre-execution middlewares if the error handler fails', async t => {
	const stubHandler = t.context.stub();
	const stubCallback = t.context.stub();
	const stubMiddlewares = [
		{
			before: () => {
				throw new Error('bang');
			},
			onError: (res, error) => [res, error]
		}
	];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});

	await t.throwsAsync(lambdaFunc('event', 'context', stubCallback), {
		instanceOf: Error,
		message: 'bang'
	});

	t.deepEqual(stubHandler.calls, []);
});

test('Wrapped lambda function - should handle exceptions from pre-execution middlewares with error handling middleware', async t => {
	const stubHandler = t.context.stub();
	const stubCallback = t.context.stub();
	const stubMiddlewares = [
		{
			before: () => {
				throw new Error('bang');
			},
			onError: () => 'some new result'
		}
	];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});
	const result = await lambdaFunc('event', 'context', stubCallback);

	t.is(result, 'some new result');
	t.deepEqual(stubHandler.calls, []);
});

[1, 3].forEach(numMiddlewares =>
	test(`Wrapped lambda function - should execute ${numMiddlewares} post-execution middlewares and the handler`, async t => {
		const stubHandler = t.context.stub(() => 'result');
		const stubCallback = t.context.stub();
		const stubMiddlewares = Array.from({ length: numMiddlewares }, () => ({
			after: t.context.stub()
		}));

		const lambdaFunc = lambda({
			handler: stubHandler,
			middlewares: stubMiddlewares
		});

		await lambdaFunc('event', 'context', stubCallback);

		stubMiddlewares.forEach(({ after }) => t.snapshot(after.calls));
		t.snapshot(stubHandler.calls);
	})
);

test('Wrapped lambda function - should rethrow exceptions from post-execution middlewares if there are no error handlers', async t => {
	const stubHandler = t.context.stub(() => 'result');
	const stubCallback = t.context.stub();
	const stubMiddlewares = [
		{
			after: () => {
				throw new Error('bang');
			}
		}
	];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});

	await t.throwsAsync(lambdaFunc('event', 'context', stubCallback), {
		instanceOf: Error,
		message: 'bang'
	});

	t.snapshot(stubHandler.calls);
});

test('Wrapped lambda function - should rethrow exceptions from post-execution middlewares if the error handler fails', async t => {
	const stubHandler = t.context.stub(() => 'result');
	const stubCallback = t.context.stub();
	const stubMiddlewares = [
		{
			after: () => {
				throw new Error('bang');
			},
			onError: error => [error]
		}
	];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});

	await t.throwsAsync(lambdaFunc('event', 'context', stubCallback), {
		instanceOf: Error,
		message: 'bang'
	});

	t.snapshot(stubHandler.calls);
});

test('Wrapped lambda function - should handle exceptions from post-execution middlewares with error handling middleware', async t => {
	const stubHandler = t.context.stub(() => 'result');
	const stubCallback = t.context.stub();
	const stubMiddlewares = [
		{
			after: () => {
				throw new Error('bang');
			},
			onError: () => 'some new result'
		}
	];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});
	const result = await lambdaFunc('event', 'context', stubCallback);

	t.is(result, 'some new result');
	t.snapshot(stubHandler.calls);
});

/**
 * The Wrapped lambda function - Invoke
 */
test('Wrapped lambda function - proxies lambda callback wrapping with Post-Execution middlewares', async t => {
	const stubHandler = t.context.stub((_event, _context, callback) =>
		callback('result')
	);
	const stubCallback = t.context.stub();
	const stubMiddleware = t.context.stub();

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: [{ after: stubMiddleware }]
	});

	await lambdaFunc('event', 'context', stubCallback);

	t.snapshot(stubCallback.calls);
	t.snapshot(stubMiddleware.calls);
});

test('Wrapped lambda function - proxies returned promise wrapping with Post-Execution middlewares', async t => {
	const stubHandler = t.context.stub(async () => 'result');
	const stubCallback = t.context.stub();
	const stubMiddleware = t.context.stub();

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: [{ after: stubMiddleware }]
	});

	const response = await lambdaFunc('event', 'context', stubCallback);

	t.is(response, 'result');
	t.snapshot(stubMiddleware.calls);
});

test('Wrapped lambda function - should rethrow exceptions thrown by the handler if there are no error handlers', async t => {
	const stubHandler = t.context.stub(() => {
		throw new Error('bang');
	});
	const stubCallback = t.context.stub();

	const lambdaFunc = lambda(stubHandler);

	await t.throwsAsync(lambdaFunc('event', 'context', stubCallback), {
		instanceOf: Error,
		message: 'bang'
	});
});

test('Wrapped lambda function - should rethrow exceptions thrown by the handler if the error handler fails', async t => {
	const stubHandler = t.context.stub(() => {
		throw new Error('bang');
	});
	const stubCallback = t.context.stub();
	const stubMiddlewares = [{ onError: error => [error] }];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});

	await t.throwsAsync(lambdaFunc('event', 'context', stubCallback), {
		instanceOf: Error,
		message: 'bang'
	});
});

test('Wrapped lambda function - should handle exceptions thrown by the handler with error handling middleware', async t => {
	const stubHandler = t.context.stub(() => {
		throw new Error('bang');
	});
	const stubCallback = t.context.stub();
	const stubMiddlewares = [{ onError: () => 'some new result' }];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});
	const result = await lambdaFunc('event', 'context', stubCallback);

	t.is(result, 'some new result');
});

/**
 * The Wrapped lambda function - Use
 */

[0, 1, 3].forEach(numMiddlewares =>
	test(`Wrapped lambda function - should add the new middlewares before component to the the existing ${numMiddlewares} beforeMiddlewares`, async t => {
		const newMiddleware = t.context.stub();
		const stubHandler = t.context.stub(async () => 'result');
		const stubCallback = t.context.stub();

		const stubMiddlewares = Array.from({ length: numMiddlewares }, () => ({
			before: () => {}
		}));

		const lambdaFunc = lambda({
			handler: stubHandler,
			middlewares: stubMiddlewares
		});

		const updatedLambda = lambdaFunc.use({ before: newMiddleware });
		await updatedLambda('event', 'context', stubCallback);

		t.snapshot(newMiddleware.calls);
	})
);

[0, 1, 3].forEach(numMiddlewares =>
	test(`Wrapped lambda function - should add the new middlewares after component to the the existing ${numMiddlewares} afterMiddlewares`, async t => {
		const newMiddleware = t.context.stub();
		const stubHandler = t.context.stub(async () => 'result');
		const stubCallback = t.context.stub();

		const stubMiddlewares = Array.from({ length: numMiddlewares }, () => ({
			after: () => {}
		}));

		const lambdaFunc = lambda({
			handler: stubHandler,
			middlewares: stubMiddlewares
		});

		const updatedLambda = lambdaFunc.use({ after: newMiddleware });
		await updatedLambda('event', 'context', stubCallback);

		t.snapshot(newMiddleware.calls);
	})
);

[0, 1, 3].forEach(numMiddlewares =>
	test(`Wrapped lambda function - should add the new middlewares onError component to the the existing ${numMiddlewares} errorMiddlewares`, async t => {
		const newMiddleware = t.context.stub(() => 'some new result');
		const stubHandler = t.context.stub(async () => {
			throw new Error('Bang');
		});
		const stubCallback = t.context.stub();

		const stubMiddlewares = Array.from({ length: numMiddlewares }, () => ({
			onError: () => {}
		}));

		const lambdaFunc = lambda({
			handler: stubHandler,
			middlewares: stubMiddlewares
		});

		const updatedLambda = lambdaFunc.use({ onError: newMiddleware });
		const result = await updatedLambda('event', 'context', stubCallback);

		t.is(result, 'some new result');
		t.snapshot(newMiddleware.calls);
	})
);

const useMiddlewareTestMacro = async (
	t,
	numMiddlewares,
	handler,
	expectedResult
) => {
	const newBeforeMiddleware = t.context.stub();
	const newAfterMiddleware = t.context.stub(() => "an error didn't occur");
	const newErrorMiddleware = t.context.stub(() => 'an error occured');

	const stubHandler = t.context.stub(handler);
	const stubCallback = t.context.stub();

	const stubMiddlewares = Array.from({ length: numMiddlewares }, () => ({
		before: () => {},
		after: () => {},
		onError: () => {}
	}));

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});

	const updatedLambda = lambdaFunc.use({
		before: newBeforeMiddleware,
		after: newAfterMiddleware,
		onError: newErrorMiddleware
	});

	const result = await updatedLambda('event', 'context', stubCallback);

	t.is(result, expectedResult);
	t.snapshot(newBeforeMiddleware.calls);
	t.snapshot(newAfterMiddleware.calls);
	t.snapshot(newErrorMiddleware.calls);
};

[0, 1, 3].forEach(numMiddlewares => {
	test(
		`Wrapped lambda function - should add all the new middlewares components to the the existing ${numMiddlewares} middlewares`,
		useMiddlewareTestMacro,
		numMiddlewares,
		() => {},
		"an error didn't occur"
	);

	test(
		`Wrapped lambda function - should add all the new middlewares components to the the existing ${numMiddlewares} middlewares - ERROR CASE`,
		useMiddlewareTestMacro,
		numMiddlewares,
		() => {
			throw new Error('bang');
		},
		'an error occured'
	);
});

/**
 * The Wrapped lambda function - withLogger
 */

test('The Wrapped lambda function - withLogger should create a lambda function with the new logger', async t => {
	const stubHandler = () => 'result';
	const stubLogger = {
		info: t.context.stub(),
		debug: t.context.stub(),
		warn: t.context.stub(),
		error: t.context.stub(),
		trace: t.context.stub(),
		group: t.context.stub(),
		groupEnd: t.context.stub()
	};

	const stubMiddlewares = [
		{
			before: () => {},
			after: () => {},
			onError: () => {}
		}
	];

	const lambdaFunc = lambda({
		handler: stubHandler,
		middlewares: stubMiddlewares
	});

	const updatedLambda = lambdaFunc.withLogger(stubLogger);

	await updatedLambda('event', 'context');

	Object.values(stubLogger).forEach(logger => t.snapshot(logger.calls));
});
