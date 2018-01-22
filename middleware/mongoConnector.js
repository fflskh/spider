const mongoose = require('mongoose');
//使用内置的Promise作为mongoose的Promise库
mongoose.Promise = global.Promise;

module.exports = async function (config) {
    if(!config) {
        throw new Error('Failed to get mongodb configurations.');
    }

    _logger.info(`connect to mongodb, uri: ${config.uri}, \n options: ${JSON.stringify(config.options)}`);

    await mongoose.connect(config.uri, config.options);
};