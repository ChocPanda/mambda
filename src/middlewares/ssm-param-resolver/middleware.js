module.exports = ({
	parameterNames = [],
	ssmClient = require('aws-sdk/clients/ssm')
} = {}) => ({
	before: async event => {
		const params = await ssmClient.getParameters({
			Names: parameterNames
		}).promise;
		return {
			...event,
			_ssmParams: params
		};
	}
});
