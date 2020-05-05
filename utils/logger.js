'use strict';
const { createLogger, format, transports } = require('winston');
// const appRoot = require('app-root-path');

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [new transports.Console()]
});

// const options = {
//     file: {
//       level: 'info',
//       // eslint-disable-next-line no-undef
//       filename: `${appRoot}/logs/app.log`,
//       handleExceptions: true,
//       json: true,
//       maxsize: 5242880, // 5MB
//       maxFiles: 5,
//       colorize: false,
//     },
//     console: {
//       level: 'debug',
//       handleExceptions: true,
//       json: false,
//       colorize: true,
//     },
//    };

//    const logger = createLogger({
//     transports: [
//       new transports.File(options.file),
//       new transports.Console(options.console)
//     ],
//     exitOnError: false, // do not exit on handled exceptions
//    });

module.exports = logger;