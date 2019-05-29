const { HttpError } = require('http-errors');
const { createHttpError } = require('../utils');

const defaultResponseBody = ({ includeMessage }) => error =>
	process.env.NODE_ENV === 'development'
		? `An error occurred: ${error.message};\n\n${error.stack}`
		: `An error occurred: ${includeMessage && error.message}`;

module.exports = ({
	defaultStatus = 500,
	createResponseBody = defaultResponseBody,
	...responseBodyParams
} = {}) => {
	const responseBodyFn = createResponseBody(responseBodyParams);
	return {
		onError: (event = {}, error) => {
			if (error instanceof HttpError) {
				return {
					...event,
					status: error.status,
					statusCode: error.statusCode,
					headers: error.headers || {},
					body: responseBodyFn(error)
				};
			}

			if (typeof defaultStatus === 'number') {
				const wrappedError = createHttpError(
					error.status || error.statusCode || defaultStatus,
					error
				);

				return {
					...event,
					status: wrappedError.status,
					statusCode: wrappedError.statusCode,
					headers: wrappedError.headers || {},
					body: responseBodyFn(wrappedError),
				};
			}
		}
	};
};
