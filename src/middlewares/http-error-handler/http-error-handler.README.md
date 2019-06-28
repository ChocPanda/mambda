# HTTP Error Handling Middleware

A [mambda](https://github.com/ChocPanda/mambda) middleware handles [http-errors](https://github.com/jshttp/http-errors) thrown during lambda execution.

## Contents

<!-- toc -->

- [Usage](#usage)
- [Configuration](#configuration)

<!-- tocstop -->

## Example

Given a lambda function in the form:

```javascript
const lambda = require('mambda');
const createHttpError = require('http-errors');
const httpErrorHandler = require('mambda/middlewares/http-error-handler');

const handler = (event, context, callback) => {
	if (!businessLogicRequirement(event)) {
		throw createHttpError(400, "Some requirement of the business logic isn't met")
	}
	// function code...
};

module.exports.handler = lambda({ handler, middlewares: [httpErrorHandler()] });
```

If the `businessLogicRequirement` condition is not met, the handler will throw an exception describing a 400 response and some message to be included in the body.
The `http-error-handler` middleware catches this exception and transforms it into a lambda response that can be returned to the event trigger.

```javascript
// If NODE_ENV === 'development', The response will likely take the form
const devResponse = {
	status: 400,
	statusCode: 400,
	body:
		`A HttpError occurred:
			"Some requirement of the business logic isn't met"

			at repl:1:1
			at Script.runInThisContext (vm.js:96:20)
			at REPLServer.defaultEval (repl.js:332:29)
			at bound (domain.js:395:14)
			...` // The rest of the callstack...
}

// If NODE_ENV isn't 'development', e.g. you're in 'production', the response will likely take the form:
const devResponse = {
	status: 400,
	statusCode: 400,
	body:
		`A HttpError occurred:
			"Some requirement of the business logic isn't met"`
}
```

You can of course use the [createResponseBody configuration option](#configuration) to change how these error messages appear, good options for may include [pretty-errors](https://github.com/AriaMinaei/pretty-error)

## Usage

Ensure the ['mambda'](../../../README.md#Usage) has been added as a dependency to your project

The error handler can either be passed as part of the middlewares array:

```javascript
const lambda = require('mambda');
const httpErrorHandler = require('mambda/middlewares/http-error-handler');

const handler = (event, context, callback) => {
	const { body, ...otherEventProps } = event
	// Body will be a deserialized json object
	// My lambda function handler...
};

module.exports.handler = lambda({ handler, middlewares: [
	httpErrorHandler({ defaultStatus: 500, createResponseBody: ... }) // These are default values for the config and therefore unnecessary
]});
```

Or can be added to an existing lambda func using the `use` function

```javascript
const lambda = require('mambda');
const httpErrorHandler = require('mambda/middlewares/http-error-handler');

const lambdaFunc = lambda((event, context, callback) => { /* function code... */ })

module.exports.handler = lambdaFunc.use(
	httpErrorHandler({ defaultStatus: 500, createResponseBody: ... }) // These are default values for the config and therefore unnecessary
);
```

## Configuration

-   **defaultStatus** (default: 500): The status code of non-http-error responses.
-   **responseBodyParams** (default: `{ includeMessage: false }`):
-   Parameters used to configure how the body of the error response is formatted
-   If you're using the default response body the includeMessage param can be set to include error messages in the response in production
-   **createResponseBody** : A function to create the body of the error response
