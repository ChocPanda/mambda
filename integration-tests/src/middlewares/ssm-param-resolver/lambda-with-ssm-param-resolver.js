// TODO It seems that ava's sources are not added to the node resolution path.
const lambda = require('../../../../dist');
const ssmParamResolver = require('../../../../dist/middlewares/ssm-param-resolver');

const parametersToLoad = [
    "/mambda/test/A",
    "/mambda/test/B"
]

async function ssmParamConsumer(event) {
    return {
        A: event._ssmParams["/mambda/test/A"],
        B: event._ssmParams["/mambda/test/B"],
    };
}

exports.handler = lambda(ssmParamConsumer)
    .use(ssmParamResolver({
        parameterNames: parametersToLoad
    }));