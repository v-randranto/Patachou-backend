'use strict';
const { createLogger, format, transports } = require('winston');
const path = require('path');
// eslint-disable-next-line no-undef
const env = process.env.NODE_ENV || 'development';

const logDir = `log`;
const fileNameFormat = `qdo-qualif_%DATE%`;
const logFilename = path.join(logDir, `${fileNameFormat}.log`);
const logErrorFilename = path.join(logDir, `${fileNameFormat}_error.log`);

const logFormat = (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`;

const options = {
  console: {
    level: 'debug',
    format: format.combine(
      format.colorize(),
      format.printf(logFormat)
    )
  },
  
  file: {
    level: 'info',
    filename: logFilename,
    datePattern: 'YYYY-MM-DD',
    format: format.printf(logFormat)
  },
  
  errorFile: {
    level: 'error',
    filename: logErrorFilename,
    datePattern: 'YYYY-MM-DD',
    format: format.printf(logFormat)
  }

}


const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    })
  ),
  transports: [
    new transports.File(options.file),
    new transports.File(options.errorFile)
  ]
});
if (env === 'development') {
logger.add(new transports.Console(options.console));
}

module.exports = logger;