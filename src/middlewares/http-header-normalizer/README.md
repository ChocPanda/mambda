# Http Header Normalizer

A [mambda](https://github.com/ChocPanda/mambda) middleware which will rewrite the http request header keys to Camel-Kebab-Case and seperate out your [multiValueHeaders](https://aws.amazon.com/blogs/compute/support-for-multi-value-parameters-in-amazon-api-gateway/) in the response for integration with AWS API gateway.

## Contents

<!-- toc -->

-   [Usage](#usage)

<!-- tocstop -->

## Example

Given the event:

```javascript
const event = {
	headers: {
		'content-type': 'application/json'
	},
	multiValueHeaders: {
		accept: [ '*/*' ],
		'accept-Encoding': [ 'gzip, deflate' ],
		'cache-control': [ 'no-cache' ],
		'CloudFront-forwarded-Proto': [ 'https' ]
	}
	// ... other event members
};
```

The middleware would result in:

```javascript
const result = {
	headers: {
		'Content-Type': 'application/json'
		Accept: [ '*/*' ],
		'Accept-Encoding': [ 'gzip, deflate' ],
		'Cache-Control': [ 'no-cache' ],
		'CloudFront-Forwarded-Proto': [ 'https' ]
	}
	// ... other event members
};
```

All headers will be combined into a single object with the keys in a normalized format making it easier to parse and search for headers.
This process is then reversed for integration into the API gateway in the response even in the event of an error.

## Usage

Ensure the ['mambda'](../../../README.md#Usage) has been added as a dependency to your project

The http-header-normalizer can either be passed as part of the middlewares array:

```javascript
const lambda = require('mambda');
const httpHeaderNormalizer = require('mambda/middlewares/http-header-normalizer');

const handler = (event, context, callback) => {
	const { headers, ...otherEventProps } = event
	// Headers will be an object with normalized keys as described above
	// My lambda function handler...
};

module.exports.handler = lambda({ handler, middlewares: [
	httpHeaderNormalizer()
]});
```

Or can be added to an existing lambda func using the use function

```javascript
const lambda = require('mambda');
const httpHeaderNormalizer = require('mambda/middlewares/http-header-normalizer');

const handler = (event, context, callback) => {
	const { headers, ...otherEventProps } = event
	// Headers will be an object with normalized keys as described above
	// My lambda function handler...
};

const lambdaFunc = lambda(handler)

module.exports.handler = lambdaFunc.use(httpHeaderNormalizer());
```
