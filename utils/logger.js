const moment = require('moment');
const RotateFile = require( 'winston-daily-rotate-file');

function getLoggerOptions(winston){
    var logLevel = process.env.LOG_LEVEL;//i.e info
    var logFileLocation = process.env.LOG_FILE_LOCATION;
    console.log('Logger: creating file at ' +logFileLocation + ', level ' + logLevel);
    winston.setLevels({
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    })
      
      winston.addColors({
        debug: 'blue',
        info: 'cyan',
        warn: 'yellow',
        error: 'red',
      })
      return  {
        transports: [
            new (winston.transports.Console)({
                level: logLevel,
                prettyPrint: true,
                colorize: true,
                silent: false,
                timestamp: () => moment(new Date()).format('YYYY-MM-DD hh:mm:ss'),
              }),
              new ( winston.transports.File)({
                level: logLevel,
                prettyPrint: true,
                silent: false,
                colorize: false,
                filename: logFileLocation +'.log',
                timestamp: () => moment(new Date()).format('YYYY-MM-DD hh:mm:ss'),
                json: false,
                maxFiles: 10,
                datePattern: '.yyyy-MM-dd.txt',
              }),
        ]
      }
}
var _logger = null;
module.exports = {
    getOptions:function(winston){
        return getLoggerOptions(winston);
    },
    initialize: function (winston) {
       
        _logger = new winston.Logger(getLoggerOptions(winston));
         
        return _logger
    },
    getLogger:function(){
        return _logger;
    }
}
