'use strict'
require('dotenv').config();
const app = require('./src/app');
const debug = require('debug')('backend:server');
const http = require('http');
const logger = require('./src/utils/logger');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
/**
 * Get port from environment and store in Express.
 */

// eslint-disable-next-line no-undef
const port = normalizePort(process.env.PORT || 3000);
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, function () {
  // eslint-disable-next-line no-undef
  console.log(`Server ${process.env.NODE_ENV} listening on port ${port}`);
});
server.on('error', onError);
server.on('listening', onListening);

/**
 * Socket.io 
 */
const ioServer = require("socket.io")(server);

ioServer.on("connect", function (ioSocket) {
  logger.info(`[${base}/ioServer.on()] - client connected !`);
  ioSocket.on("message", function (message){
    logger.console(message);
  });
});


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      // eslint-disable-next-line no-undef
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      // eslint-disable-next-line no-undef
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
