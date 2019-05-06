const createError = require('http-errors');
const { HttpError } = require('http-errors');

const normalizePreExecutionMiddleware = middleware => async (
	event,
	context
) => {
	const middlewareRes = await middleware(event, context);
	const [newEvent = event, newContext = context] = Array.isArray(middlewareRes)
		? middlewareRes
		: [middlewareRes, context];
	return [newEvent, newContext];
};

const normalizePostExecutionMiddleware = middleware => async (
	result,
	event,
	context
) => {
	const middlewareRes = await middleware(result, event, context);
	const [
		newResult = result,
		newEvent = event,
		newContext = context
	] = Array.isArray(middlewareRes)
		? middlewareRes
		: [middlewareRes, event, context];
	return [newResult, newEvent, newContext];
};

const normalizeErrorExecutionMiddleware = middleware => async (
	result,
	error,
	event,
	context
) => {
	const middlewareRes = await middleware(result, error, event, context);
	const [
		newResult = result,
		newError = error,
		newEvent = event,
		newContext = context
	] = Array.isArray(middlewareRes) ? middlewareRes : [middlewareRes, error];
	return [newResult, newError, newEvent, newContext];
};

const nullLogger = {
	info: () => {},
	debug: () => {},
	warn: () => {},
	error: () => {},
	trace: () => {}
};

const reduceMiddlewares = ({
	errorHandler,
	middlewares,
	logger = nullLogger
}) => async (...args) =>
	middlewares.reduce(async (currPromise, middleware) => {
		const currResult = await currPromise;
		logger.trace('Executing middleware, current parameters:', currResult);
		try {
			return await middleware(...currResult);
		} catch (error) {
			return errorHandler(...currResult)(error);
		}
	}, args);

// This is a horrible hack that should be removed
function ExtendedHttpError(...args) {
	const error = createError(...args);
	const self = this;

	Object.entries(error).forEach(([key, value]) => {
		self[key] = value;
	});
}

ExtendedHttpError.prototype = Object.create(HttpError.prototype);

module.exports.normalizePreExecutionMiddleware = normalizePreExecutionMiddleware;
module.exports.normalizePostExecutionMiddleware = normalizePostExecutionMiddleware;
module.exports.normalizeErrorExecutionMiddleware = normalizeErrorExecutionMiddleware;
module.exports.reduceMiddlewares = reduceMiddlewares;
module.exports.createHttpError = (...args) => new ExtendedHttpError(...args);
module.exports.nullLogger = nullLogger;
