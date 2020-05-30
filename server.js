'use strict';
require('dotenv').config();
const app = require('./src/app');
const debug = require('debug')('backend:server');
const http = require('http');
const { logging } = require('./src/utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

const ent = require('ent');
// const encode = require('ent/encode');
// const decode = require('ent/decode');

// eslint-disable-next-line no-undef
const port = normalizePort(process.env.PORT || 3000);
const noSession = null;
app.set('port', port);

// création du serveur http
const server = http.createServer(app);

server.listen(port, function () {  
  logging('info', base, noSession,
    // eslint-disable-next-line no-undef
    `Server ${process.env.NODE_ENV.toUpperCase()} listening on port ${port}`
  );
});
server.on('error', onError);
server.on('listening', onListening);

// normalisation du n° port d'écoute
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

// Gestion des erreurs sur serveur http
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      logging('error', base, noSession, `${bind} requires elevated privileges`);
      // eslint-disable-next-line no-undef
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logging('error', base, noSession, `${bind} is already in use`);
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
// Gestion des erreurs sur serveur http.
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

/**
 *  Partie Socket.io
 */
const io = require('socket.io')(server);
const connections = [];

io.on('connect', function (socket) {
  logging('info', base, socket.id, `Socket.io client connected !`);
  // envoyer au client le nb de members connectés
  socket.emit('connectedMembers', connections.length);

  // insérer l'id socket de l'utilisateur qui vient de se connecter dans la table connexions et renvoyer à tous les clients la mise à jour du nb de membres connectés.
  socket.on('connectMember', function (member) {
    logging('info', base, socket.id, `${member.pseudo} is connected.`);
    socket.pseudo = ent.encode(member.pseudo);
    connections.push(socket.id);
    io.emit('connectedMembers', connections.length);
  });

  // déconnecter la socket du membre qui a été déconnecté du site
  socket.on('disconnectMember', function () {
    logging('info', base, socket.id, `starting disconnection`);    
    socket.disconnect();
  });

  // retirer de la table connexions le membre déconnecté
  socket.on('disconnect', function (reason) {
    logging('info', base, socket.id, `disconnected, reason: `, reason);
    const index = connections.indexOf(socket.id);
    if (index !== -1) {
      connections.splice(index, 1);
      logging('info', base, socket.id, `${socket.id.pseudo} disconnected`);
      io.emit('connectedMembers', connections.length);
    } else {
      logging('info', base, socket.id, `not found in connexions`);
    }
  });
});


