const test = require('ava');
const middleware = require('../middleware');

test.todo('HttpHeaderNormalizer - should canonicalize an input header');
test.todo('HttpHeaderNormalizer - should canonicalize all input headers');
test.todo(
	'HttpHeaderNormalizer - should not change input headers with canonical names'
);
test.todo('HttpHeaderNormalizer - should seperate normal and multi-value headers')

test.todo('HttpHeaderNormalizer - should canonicalize an output header');
test.todo('HttpHeaderNormalizer - should canonicalize all output headers');
test.todo(
	'HttpHeaderNormalizer - should not change output headers with canonical names'
);

test.todo(
	'HttpHeaderNormalizer - should canonicalize an output header on error'
);
test.todo(
	'HttpHeaderNormalizer - should canonicalize all output headers on error'
);
test.todo(
	'HttpHeaderNormalizer - should not change output headers on error with canonical names'
);
