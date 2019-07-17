# SSM Parameter Resolver Middleware

A [mambda](https://github.com/ChocPanda/mambda) middleware will retrieve the specified SSM parameters and attach them to the event using the `_ssmParams` key.

## Contents

<!-- toc -->

- [Usage](#usage)
- [Configuration](#configuration)

<!-- tocstop -->

## Example

Given that the event below:

```javascript
const event = {
	body: `Some text`,
	// ...rest of the event object
};
```

Was passed through a middleware created like this:

```javascript
const ssmMiddleware = ssmParamResolver({
	parameterNames: [
		"/mambda/test/A",
		"/mambda/test/B"
	]
});
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

## Usage

Ensure the ['mambda'](../../../README.md#Usage) has been added as a dependency to your project

## Configuration

-   **parameterNames** (default: []): The list of SSM Parameters to resolve
-   **ssmClient** (default: `require('aws-sdk/clients/ssm')`): The ssm client to use to contact the service
