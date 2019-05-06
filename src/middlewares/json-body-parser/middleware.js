const { createHttpError } = require('../utils');

module.exports = ({ assumeJson = false, deserialize = JSON.parse } = {}) => ({
	before: (event = {}) => {
		const { headers = {}, body } = event;
		const contentTypeHeader =
			headers['Content-Type'] ||
			headers['content-type'] ||
			(assumeJson && body && 'application/json');

		const contentType = (contentTypeHeader || '').split(';')[0];

		if (contentType === 'application/json') {
			try {
				return { ...event, body: deserialize(body) };
			} catch (error) {
				throw createHttpError(
					422,
					'Content type defined as JSON but invalid JSON was provided',
					error,
					{ expose: process.env.NODE_ENV === 'development' }
				);
			}
		}

		return event;
	}
});
