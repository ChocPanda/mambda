# SSM Parameter Resolver Middleware

A [mambda](https://github.com/ChocPanda/mambda) middleware will retrieve the specified SSM parameters and attach them to the event using the `_ssmParams` key.

## Contents

<!-- toc -->

- [Usage](#usage)
- [Configuration](#configuration)

<!-- tocstop -->

## Example

Given that the event:

```javascript
const event = {
	body: `Some text`,
	// ...rest of the event object
};
```

The middleware would result in e.g.:

```javascript
const result = {
	body: `Some text`,
	_ssmParams: {
		"Parameters": [
			{
				Name: "/a/b/c/",
				Type: "String",
				Value: "Barnacle"
			}
		]
	},
	// ...rest of the event object
};
```

Invalid json in the request body will result in throwing a [http-error](https://github.com/jshttp/http-errors) with the status code 422, [(Unprocessable entity)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422).
The expose flag will be set in the exception properties if NODE_ENV is set to development.

## Usage

Ensure the ['mambda'](../../../README.md#Usage) has been added as a dependency to your project

The json body parser can either be passed as part of the middlewares array:

```javascript
const lambda = require('mambda');
const jsonParser = require('mambda/middlewares/json-body-parser');

const handler = (event, context, callback) => {
	const { body, ...otherEventProps } = event
	// Body will be a deserialized json object
	// My lambda function handler...
};

module.exports.handler = lambda({ handler, middlewares: [
	jsonParser({ assumeJson: false, deserialize: JSON.parse }) // These are default values for the config and therefore unnecessary
]});
```

Or can be added to an existing lambda func using the use function

```javascript
const lambda = require('mambda');
const jsonParser = require('mambda/middlewares/json-body-parser');

const handler = (event, context, callback) => {
	const { body, ...otherEventProps } = event
	// Body will be a deserialized json object
	// My lambda function handler...
};

const lambdaFunc = lambda(handler)

module.exports.handler = lambdaFunc.use(
	jsonParser({ assumeJson: false, deserialize: JSON.parse }) // These are default values for the config and therefore unnecessary
);
```

## Configuration

-   **assumeJson** (default: false): Will attempt to deserialize the request body as json if the `Content-Type` has not been specified.
-   **deserialize** (default: [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)): The json parse function to use when deserializing request body.
