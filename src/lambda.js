const {
	normalizePreExecutionMiddleware,
	normalizePostExecutionMiddleware,
	normalizeErrorExecutionMiddleware,
	reduceMiddlewares,
	nullLogger
} = require('./middlewares/utils');

const traverseAndNormalize = middlewares => (
	initBeforeMiddlewares = [],
	initAfterMiddlewares = [],
	initOnErrorMiddlewares = []
) =>
	middlewares.reduce(
		(
			{ preExMiddlewares, postExMiddlewares, errorMiddlewares },
			{ before, after, onError }
		) => ({
			preExMiddlewares: before
				? [...preExMiddlewares, normalizePreExecutionMiddleware(before)]
				: preExMiddlewares,
			postExMiddlewares: after
				? [...postExMiddlewares, normalizePostExecutionMiddleware(after)]
				: postExMiddlewares,
			errorMiddlewares: onError
				? [...errorMiddlewares, normalizeErrorExecutionMiddleware(onError)]
				: errorMiddlewares
		}),
		{
			preExMiddlewares: initBeforeMiddlewares,
			postExMiddlewares: initAfterMiddlewares,
			errorMiddlewares: initOnErrorMiddlewares
		}
	);

const createErrorHandler = (errorMiddlewares, logger) => (
	event,
	context
) => async error => {
	logger.warn(
		'Caught an exception, attempting to use error handling middleware to create a response',
		error,
		event,
		context
	);
	const middlewareRes = await reduceMiddlewares({
		middlewares: errorMiddlewares,
		logger,
		errorHandler: err => {
			throw err;
		}
	})(undefined, error, event, context);

	const [result, transformedError] = middlewareRes;

	if (result) {
		return middlewareRes;
	}

	logger.error(
		'Failed to handle exception and generate a response',
		transformedError
	);
	if (logger.group) {
		logger.groupEnd();
	}

	throw transformedError;
};

const createLambdaFunc = ({
	init,
	handler,
	middlewares,
	logger = nullLogger,
	before = [],
	after = [],
	onError = []
}) => {
	const {
		preExMiddlewares,
		postExMiddlewares,
		errorMiddlewares
	} = traverseAndNormalize(middlewares)(before, after, onError);

	const errorHandler = createErrorHandler(errorMiddlewares, logger);

	let cachedHandler;

	const lambdaFunc = async (event, context, callback) => {
		if (logger.group) {
			logger.group(`${context.functionName} - ${context.awsRequestId}`);
		}

		logger.info(
			`Lambda function invocation: ${
				cachedHandler ? 'using cached execution context' : 'cold start'
			}`,
			event,
			context
		);
		cachedHandler =
			cachedHandler || (cachedHandler = init ? handler(init()) : handler);

		const beforeResult = await reduceMiddlewares({
			middlewares: preExMiddlewares,
			logger,
			errorHandler
		})(event, context);

		/**
		 * The pre-execution middlewares return an array of the event and context
		 * in shape [modifiedEvent, modifiedContext]
		 *
		 * If an error occurred whilst executing the pre-execution middlewares then
		 * the error handling middlewares will have been executed, these return an
		 * array with the new result at the head of the array and the event and
		 * context parameters passed to the middleware that threw the exception.
		 *
		 * If the error handling middlewares failed to normalize the result from the
		 * error (fail to return a non-error object), then the error handler will have
		 * re-thrown the resultant error.
		 *
		 * Todo find a less cryptic way of expressing this
		 */
		if (beforeResult.length > 2) {
			const [errorResult, error, errorEvent, errorContext] = beforeResult;
			logger.error(
				'Caught and handled an exception during the execution of the pre-execution middlewares',
				error
			);
			logger.info(
				'Returning error response',
				errorResult,
				errorEvent,
				errorContext
			);
			if (logger.group) {
				logger.groupEnd();
			}

			return errorResult;
		}

		const [modifiedEvent, modifiedContext] = beforeResult;
		logger.debug(
			'Completed execution of the pre-execution middlewares',
			modifiedEvent,
			modifiedContext
		);
		/**
		 * AWS provides a flexible API for the authors of lambdas:
		 * https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html,
		 *
		 * One can return the result of the execution from the handler function,
		 * a promise of the result or pass the result to the callback provided.
		 *
		 * The callbackFlag indicates whether the handler function being wrapped in
		 * middleware exitted by calling the callback or returned a value. The middleware
		 * will use the flag to behave in the same way.
		 */
		const [
			{ callbackFlag = false, error: executionError },
			result
		] = await new Promise(resolve =>
			resolve(
				cachedHandler(modifiedEvent, modifiedContext, res =>
					resolve([{ callbackFlag: true }, res])
				)
			)
		)
			.then(res =>
				Array.isArray(res) && res[0].callbackFlag ? res : [{}, res]
			)
			.catch(async error => {
				const [errorResult] = await errorHandler(
					modifiedEvent,
					modifiedContext
				)(error);
				return [{ error }, errorResult];
			});

		if (executionError) {
			logger.error(
				'Caught and handled an exception during the execution of the lambda function',
				executionError
			);
			logger.info(
				'Returning error response',
				result,
				modifiedEvent,
				modifiedContext
			);
			if (logger.group) {
				logger.groupEnd();
			}

			return result;
		}

		const postMiddlewareRes = await reduceMiddlewares({
			middlewares: postExMiddlewares,
			logger,
			errorHandler
		})(result, modifiedEvent, modifiedContext);

		if (postMiddlewareRes.length === 4) {
			const [errorResult, error, errorEvent, errorContext] = beforeResult;
			logger.error(
				'Caught and handled an exception during the execution of the post-execution middlewares',
				error
			);
			logger.info(
				'Returning error response',
				errorResult,
				errorEvent,
				errorContext
			);
		}

		const [modifiedResult] = postMiddlewareRes;
		logger.info('Completed Lambda exection', modifiedResult);
		if (logger.group) {
			logger.groupEnd();
		}

		if (callbackFlag) {
			return callback(modifiedResult);
		}

		return modifiedResult;
	};

	lambdaFunc.use = newMiddlewares =>
		createLambdaFunc({
			init,
			handler,
			logger,
			middlewares: Array.isArray(newMiddlewares)
				? newMiddlewares
				: [newMiddlewares],
			before: preExMiddlewares,
			after: postExMiddlewares,
			onError: errorMiddlewares
		});

	lambdaFunc.withLogger = logger =>
		createLambdaFunc({
			init,
			handler,
			logger,
			middlewares: [],
			before: preExMiddlewares,
			after: postExMiddlewares,
			onError: errorMiddlewares
		});

	return lambdaFunc;
};

module.exports = srvFunc => {
	const { init, handler = srvFunc, middlewares = [] } = srvFunc;
	return createLambdaFunc({ init, handler, middlewares });
};
