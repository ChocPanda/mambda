const test = require('ninos')(require('ava'));
const { HttpError } = require('http-errors');
const middleware = require('../middleware');

const testGoodInput = {
	testString: 'some string',
	testNum: 1,
	testNested: { moreFields: 'with some data' },
	testArray: ['string with a number', 8, 'and another string']
};

const testBadInput = '{Some invalid json] string;';

test('Json Parsing Middleware - should parse the request body if the content type header matches application/json', t => {
	const { before: objUnderTest } = middleware();
	const event = {
		body: JSON.stringify(testGoodInput),
		headers: { 'Content-Type': 'application/json' }
	};

	const result = objUnderTest(event);

	t.deepEqual(result, { ...event, body: testGoodInput });
});

test('Json Parsing Middleware - should parse the request body if the content type header matches application/json with charset specification', t => {
	const { before: objUnderTest } = middleware();
	const event = {
		body: JSON.stringify(testGoodInput),
		headers: { 'Content-Type': 'application/json; charset="UTF8"' }
	};

	const result = objUnderTest(event);

	t.deepEqual(result, { ...event, body: testGoodInput });
});

test('Json Parsing Middleware - should ignore requests with content type other than application/json', t => {
	const { before: objUnderTest } = middleware();
	const event = {
		headers: { 'Content-Type': 'application/xml' },
		body: '<xmltag>some data</xmltag>'
	};

	const result = objUnderTest(event);

	t.deepEqual(result, event);
});

test('Json Parsing Middleware - should ignore requests with no body', t => {
	const { before: objUnderTest } = middleware();

	const result = objUnderTest({});

	t.deepEqual(result, {});
});

test('Json Parsing Middleware - should throw an unprocessable entity exception if passed invalid json', t => {
	const { before: objUnderTest } = middleware();

	const error = t.throws(
		() =>
			objUnderTest({
				body: testBadInput,
				headers: { 'Content-Type': 'application/json' }
			}),
		HttpError
	);

	t.is(error.status, 422);
	t.snapshot(error);
});

test('Json Parsing Middleware - should attempt to parse requests with no content-type headers if configured to do so', t => {
	const input = {
		testString: 'some string',
		testNum: 1,
		testNested: { moreFields: 'with some data' }
	};
	const { before: objUnderTest } = middleware({ assumeJson: true });
	const event = {
		body: JSON.stringify(input),
		headers: {}
	};

	const result = objUnderTest(event);

	t.deepEqual(result, { ...event, body: input });
});

test('Json Parsing Middleware - should use custom json parser if configured to do so', t => {
	const stubDeserializer = t.context.stub(() => testGoodInput);
	const { before: objUnderTest } = middleware({
		deserialize: stubDeserializer
	});
	const event = {
		body: JSON.stringify(testGoodInput),
		headers: { 'Content-Type': 'application/json' }
	};

	const result = objUnderTest(event);

	t.deepEqual(result, { ...event, body: testGoodInput });
	t.deepEqual(stubDeserializer.calls, [
		{
			this: undefined,
			arguments: [JSON.stringify(testGoodInput)],
			return: testGoodInput
		}
	]);
});

test('Json Parsing Middleware - should handle exceptions from custom json parser', t => {
	const stubDeserializer = t.context.stub(() => {
		throw new Error('BAD JSON');
	});
	const { before: objUnderTest } = middleware({
		deserialize: stubDeserializer
	});

	const error = t.throws(
		() =>
			objUnderTest({
				body: testBadInput,
				headers: { 'Content-Type': 'application/json' }
			}),
		HttpError
	);

	t.is(error.status, 422);
	t.snapshot(error);
});
