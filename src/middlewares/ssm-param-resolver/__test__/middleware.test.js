const test = require('ninos')(require('ava'));
const rewireMock = require('rewiremock/node');
const middleware = require('../middleware');

test('SSM Parameter Resolving Middleware - should require ssm client and use empty list of parameter names if no config at all provided', async t => {
	rewireMock.enable()
	const resultStub = t.context.stub();
	const ssmClientStub = {
		getParameters: t.context.stub(() => ({
			promise: (async () => resultStub)()
		}))
	}
	rewireMock('aws-sdk/clients/ssm').with(ssmClientStub)

	const { before: objUnderTest } = middleware();
	const event = await objUnderTest({});

	t.is(event._ssmParams, resultStub);
	t.is(ssmClientStub.getParameters.calls.length, 1);
	t.deepEqual(ssmClientStub.getParameters.calls[0].arguments, [{ Names: [] }]);
	rewireMock.disable()
});

test('SSM Parameter Resolving Middleware - should require ssm client when not provided explicitly', async t => {
	rewireMock.enable()
	const resultStub = t.context.stub();
	rewireMock('aws-sdk/clients/ssm').with({
		getParameters: t.context.stub(() => ({
			promise: (async () => resultStub)()
		}))
	})

	const { before: objUnderTest } = middleware({});
	const event = await objUnderTest({});

	t.is(event._ssmParams, resultStub);
	rewireMock.disable()
});

test('SSM Parameter Resolving Middleware - should use empty list of parameter names if non provided', async t => {
	const ssmClientStub = {
		getParameters: t.context.stub(() => ({ promise: (async () => { })() }))
	};

	const { before: objUnderTest } = middleware({
		ssmClient: ssmClientStub
	});

	await objUnderTest({});

	t.is(ssmClientStub.getParameters.calls.length, 1);
	t.deepEqual(ssmClientStub.getParameters.calls[0].arguments, [{ Names: [] }]);
});

test('SSM Parameter Resolving Middleware - should pass params to ssm client', async t => {
	const ssmClientStub = {
		getParameters: t.context.stub(() => ({ promise: (async () => { })() }))
	};

	const { before: objUnderTest } = middleware({
		ssmClient: ssmClientStub,
		parameterNames: ['/a/b/c', '/d/e/f/']
	});

	await objUnderTest({});

	t.is(ssmClientStub.getParameters.calls.length, 1);
	t.deepEqual(ssmClientStub.getParameters.calls[0].arguments, [
		{ Names: ['/a/b/c', '/d/e/f/'] }
	]);
});

test('SSM Parameter Resolving Middleware - should return response object as is in event object', async t => {
	const resultStub = t.context.stub();
	const ssmClientStub = {
		getParameters: t.context.stub(() => ({
			promise: (async () => resultStub)()
		}))
	};

	const { before: objUnderTest } = middleware({
		ssmClient: ssmClientStub
	});

	const event = await objUnderTest({});

	t.is(event._ssmParams, resultStub);
});
