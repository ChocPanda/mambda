const AWS = require('aws-sdk');
const JSZip = require("jszip");
const fs = require('fs');
const util = require('util');
const logger = console;
const iam = new AWS.IAM({ region: process.env.AWS_DEFAULT_REGION });
const readFile = util.promisify(fs.readFile);
const lambda = new AWS.Lambda({ region: process.env.AWS_DEFAULT_REGION });

const lambdaTrust = {
    Version: "2012-10-17",
    Statement: [
        {
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com"
            },
            Action: "sts:AssumeRole"
        }
    ]
}

const withRole = (roleName, policyDoc) => async continuation => {
    const fullRoleName = `${roleName}-Role`;
    logger.info(`Creating role: ${fullRoleName}`);
    const {
        Role: {
            Arn: arn
        }
    } = await iam.createRole({
        AssumeRolePolicyDocument: JSON.stringify(lambdaTrust),
        Path: "/",
        RoleName: fullRoleName
    }).promise();
    try {
        logger.info(`Created role with arn: ${arn}`);
        await withPolicy(roleName, policyDoc, arn)(continuation);
    } finally {
        logger.info(`Deleting role`);
        await iam.deleteRole({ RoleName: fullRoleName }).promise();
        logger.info(`Role deleted`);
    }
};

const withPolicy = (roleName, policyDoc, arn) => async continuation => {
    const fullRoleName = `${roleName}-Role`;
    const policyName = `${roleName}-Policy`;
    logger.info(`Creating role policy: ${policyName}`);

    await iam.putRolePolicy({
        PolicyDocument: JSON.stringify(policyDoc),
        PolicyName: policyName,
        RoleName: fullRoleName
    }).promise();

    try {
        logger.info(`Created role policy`);
        await continuation(arn);
    } finally {
        logger.info(`Deleting role policy`);
        await iam.deleteRolePolicy({
            PolicyName: policyName,
            RoleName: fullRoleName
        }).promise();
        logger.info(`Role policy deleted`);
    }
};

const withLambda =
    (functionName, roleArn, src = `../${functionName}.js`) =>
        async continuation => {
            logger.info(`Zipping lambda...`);
            const zip = new JSZip();
            zip.file(
                `${functionName}.js`,
                await readFile(src)
            );
            logger.info(`Zipped`);
            logger.info(`Creating lambda: ${functionName}`);
            const buffer = await zip.generateAsync({ type: "nodebuffer" });
            const resp = await lambda.createFunction({
                FunctionName: functionName,
                Handler: "lambda-with-ssm-param-resolver.handler",
                Runtime: "nodejs10.x",
                Code: {
                    ZipFile: buffer
                },
                Role: roleArn
            });
            logger.info(`Lambda created ${util.inspect(resp)}`);
            try {
                await continuation();
            } finally {
                logger.info(`Deleting lambda`);
                await lambda.deleteFunction({
                    FunctionName: functionName
                });
                logger.info(`Lambda deleted`);
            }
        };

module.exports = { withRole, withLambda };