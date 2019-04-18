
const winston = require('winston');

const loggerLib = require('./utils/logger');

const logger= loggerLib.initialize(winston);

const start = async function () {

    
    logger.info('Server started at: ' + server.info.uri);

    api.initialize(server,sqlDALFactory,logger);
}

start().then(()=>{
    logger.info('SERVER STARTED')
})
