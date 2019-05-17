const normalize = key => key;

const normalizeHeaders = (input = { headers: {}, multiValueHeaders: {} }) => {
	const collatedHeaders = [
		...Object.entries(input.headers),
		...Object.entries(input.multiValueHeaders)
	];

	return {
		...input,
		headers: collatedHeaders
			.filter(([, headerValue]) => !Array.isArray(headerValue))
			.reduce(
				(accHeaders, [headerKey, headerValue]) => ({
					...accHeaders,
					[normalize(headerKey)]: headerValue
				}),
				{}
			)
	};
};

export default () => ({
	before: (event = { headers: {}, multiValueHeaders: {} }) =>
		normalizeHeaders(event),
	after: (response = { headers: {}, multiValueHeaders: {} }) =>
		normalizeHeaders(response),
	onError: (response = { headers: {}, multiValueHeaders: {} }) =>
		normalizeHeaders(response)
});
