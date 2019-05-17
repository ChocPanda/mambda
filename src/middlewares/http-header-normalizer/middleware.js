const normalize = key =>
	key
		.split('-')
		.map(component => component.charAt(0).toUpperCase() + component.slice(1))
		.join('-');

const normalizeHeaders = input => {
	const collatedHeaders = [
		...Object.entries(input.headers || {}),
		...Object.entries(input.multiValueHeaders || {})
	];

	return {
		...input,
		...collatedHeaders.reduce(
			({ headers, multiValueHeaders }, [headerKey, headerValue]) =>
				Array.isArray(headerValue)
					? {
							headers,
							multiValueHeaders: {
								...multiValueHeaders,
								[normalize(headerKey)]: headerValue
							}
					  }
					: {
							multiValueHeaders,
							headers: { ...headers, [normalize(headerKey)]: headerValue }
					  },
			{ headers: {}, multiValueHeaders: {} }
		)
	};
};

module.exports = () => ({
	before: event => {
		const normalized = normalizeHeaders(event);
		return {
			...normalized,
			headers: { ...normalized.headers, ...normalized.multiValueHeaders }
		};
	},
	after: response => normalizeHeaders(response),
	onError: response => normalizeHeaders(response)
});
