const test = require('ava');
const middleware = require('../middleware')();

test('HttpHeaderNormalizer - should canonicalize an input header', t => {
	const headers = {
		'header-key': 'header-value'
	};

	const expectedInput = {
		headers: { 'Header-Key': 'header-value' },
		multiValueHeaders: {}
	};

	Object.values(middleware).forEach(objUnderTest =>
		t.deepEqual(objUnderTest({ headers }), expectedInput)
	);
});

test('HttpHeaderNormalizer - should canonicalize all input headers', t => {
	const headers = {
		'header-key-one': 'header-value',
		'header-key-two': 'header-value',
		'header-key-three': 'header-value'
	};

	const expectedInput = {
		headers: {
			'Header-Key-One': 'header-value',
			'Header-Key-Two': 'header-value',
			'Header-Key-Three': 'header-value'
		},
		multiValueHeaders: {}
	};

	Object.values(middleware).forEach(objUnderTest =>
		t.deepEqual(objUnderTest({ headers }), expectedInput)
	);
});

test('HttpHeaderNormalizer - should not change input headers with canonical names', t => {
	const headers = {
		'header-key-one': 'header-value',
		'Header-Key-Two': 'header-value',
		'header-key-three': 'header-value'
	};

	const expectedInput = {
		headers: {
			'Header-Key-One': 'header-value',
			'Header-Key-Two': 'header-value',
			'Header-Key-Three': 'header-value'
		},
		multiValueHeaders: {}
	};

	Object.values(middleware).forEach(objUnderTest =>
		t.deepEqual(objUnderTest({ headers }), expectedInput)
	);
});

test('HttpHeaderNormalizer - should seperate single and multi-value headers', t => {
	const headers = {
		'header-key': 'header-value',
		'multi-header-key': ['header-value-1', 'header-value-2']
	};

	const expectedHeaders = {
		headers: { 'Header-Key': 'header-value' },
		multiValueHeaders: {
			'Multi-Header-Key': ['header-value-1', 'header-value-2']
		}
	};

	[middleware.after, middleware.onError].forEach(objUnderTest =>
		t.deepEqual(objUnderTest({ headers }), expectedHeaders)
	);
});

test('HttpHeaderNormalizer - before middleware - should merge the single and multi value headers', t => {
	const headers = {
		'header-key': 'header-value',
		'multi-header-key': ['header-value-1', 'header-value-2']
	};

	const expectedHeaders = {
		headers: {
			'Header-Key': 'header-value',
			'Multi-Header-Key': ['header-value-1', 'header-value-2']
		},
		multiValueHeaders: {
			'Multi-Header-Key': ['header-value-1', 'header-value-2']
		}
	};

	const objUnderTest = middleware.before;
	t.deepEqual(objUnderTest({ headers }), expectedHeaders);
});
