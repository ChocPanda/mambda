const util = require('util');
const test = require('ninos')(require('ava'));
const AWS = require('aws-sdk');

const { withRole, withLambda } = require('../../../../integration-test-utils');

const logger = console;
const lambda = new AWS.Lambda({ region: process.env.AWS_DEFAULT_REGION });
const ssm = new AWS.SSM({ region: process.env.AWS_DEFAULT_REGION });

const functionName = 'lambda-with-ssm-param-resolver';
const roleName = 'SSM-Int-Test';

const policyDocument = {
	Version: '2012-10-17',
	Statement: [
		{
			Effect: 'Allow',
			Action: 'logs:CreateLogGroup',
			Resource: `arn:aws:logs:${process.env.AWS_DEFAULT_REGION}:${process.env.AWS_ACCOUNT_ID}:*`
		},
		{
			Effect: 'Allow',
			Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
			Resource: [
				`arn:aws:logs:eu-west-2:447213725459:log-group:/aws/lambda/${functionName}:*`
			]
		},
		{
			Effect: 'Allow',
			Action: 'ssm:GetParameters',
			Resource: '*'
		}
	]
};

const withSsmParams = params => async continuation => {
	try {
		await Promise.all(
			params.map(param =>
				ssm
					.putParameter(param)
					.promise()
					.then(logger.info(`Created param with name: ${param.Name}`))
			)
		);

		await continuation();
	} finally {
		logger.info(`Deleting parameters`);
		await ssm.deleteParameters({ Names: params.map(p => p.Name) }).promise();
		logger.info(`Parameters deleted`);
	}
};

test('SSM Parameter Resolving Middleware - Integration test', async () => {
	await withRole(roleName, policyDocument)(async roleArn =>
		withLambda(functionName, roleArn, 'integration-tests/dist/index.js')(
			async () =>
				withSsmParams([
					{
						Name: '/mambda/test/A',
						Type: 'String',
						Value: 'hula'
					},
					{
						Name: '/mambda/test/B',
						Type: 'StringList',
						Value: '["hula"]'
					}
				])(async () => {
					logger.info(`Invoking lambda`);
					const result = await lambda
						.invoke({
							FunctionName: functionName,
							InvocationType: 'RequestResponse',
							Payload: JSON.stringify({})
						})
						.promise();
					logger.info(`Result of invoking lambda: ${util.inspect(result)}`);

					// TODO assert we read our params back
				})
		)
	);
});
