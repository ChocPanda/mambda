const jsonBodyParser = require('./json-body-parser/middleware');
const httpErrorHandler = require('./http-error-handler/middleware');
const httpHeaderNormalizer = require('./http-header-normalizer/middleware');

module.exports = { jsonBodyParser, httpErrorHandler, httpHeaderNormalizer };
