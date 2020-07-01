'use strict';
require('dotenv').config();
const app = require('./src/app');
const debug = require('debug')('backend:server');
const http = require('http');
const { logging } = require('./src/utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const relation = require('./src/controllers/relation');
const logout = require('./src/controllers/login');

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

/******************************************************************************************
 *
 *                       Partie Socket.io
 * 
 ******************************************************************************************/

const io = require('socket.io')(server);

// table des connexions au site (après login)
const connections = []; 

// recherche l'id d'une socket dans la table des connections à partir de l'id d'un membre
const findSocketId = (memberId) => {
  return new Promise((resolve, reject) => {
    let socketIdFound = null;
    try {
      connections.forEach(connection => {
        if (connection.memberId === memberId) {
          socketIdFound = connection.socketId;
          return;
        }
      });
      resolve(socketIdFound);
    } catch (error) {
      reject(error)
    }
  });
}

// recherche l'index dans la table des connections de l'id d'une socket
const getIndex = (socketId) => {
  return new Promise((resolve, reject) => {
    let index = -1;
    try {
      connections.forEach((connection, i) => {
        if (connection.socketId === socketId) {
          index = i;
          return;
        }
      });
    resolve(index);
    } catch (error) {
      reject(error)
    }
  })
}


io.on('connect', function (socket) {
  logging('info', base, socket.id, `Socket.io client connected !`);
  // envoyer au client le nb de members connectés
  socket.emit('loggedIn', connections.length);

  /*========================================================================================*
   *   Gestion des membres connectés
   *   - A chaque fois qu'un membre se connecte, l'id de la socket et des données du 
   *     du membre sont ajoutés à la table des connections.
   *   - ses données sont retirées quand il est déconnecté 
   *   - son statut de connexion est mis à jour
   *=========================================================================================*/
  
   // un membre se connecte au site => ajout dans la table "connections"
  socket.on('login', function (member) {
    logging('info', base, socket.id, `${member.pseudo} is connected.`);
    socket.member = member;
    const connection = {
      socketId: socket.id,
      memberId: JSON.stringify(member._id),
      member: member
    };
    connections.push(connection);
    io.emit('loggedIn', connections.length);
  });

  // un membre se déconnecte du site => suppression de la table "connections" et mise à jour du statut de connexion du compte
  socket.on('logout', async function () {
    
    logging('info', base, socket.id, `starting deleting ${socket.member.pseudo} from connections`);     
    // TODO refacto
    await getIndex(socket.id)
      .then(index => {
        const pseudo = socket.member.pseudo;
        if (index !== -1) {
          connections.splice(index, 1);
          logging('info', base, socket.id, `${pseudo} deleted from connections`);        
        } else {
          logging('info', base, socket.id, `not found in connexions`);
        }
        io.emit('loggedIn', connections.length);
      });

    await logout.wsUpdateLoginStatus(socket.id, socket.member._id)  
      .then(res => {
        if (res) {
          logging('info', base, socket.id, `${socket.member.pseudo} updating login status is a success`); 
        }
      })
      .catch(error => {
        logging('error', base, socket.id, `${socket.member.pseudo} updating login status has failed ${error}`); 
      })
  });

 

  // déconnexion d'une socket => suppression de la table "connections" si ce n'est pas fait
  socket.on('disconnect', async function (reason) {
    logging('info', base, socket.id, `disconnected, reason: `, reason); 
    
    await getIndex(socket.id)
    .then(index => {
      
      if (index !== -1) {
        connections.splice(index, 1);
        logging('info', base, socket.id, `deleted from connections`);        
      } else {
        logging('info', base, socket.id, `not found in connexions`);
      }
      socket.emit('disconnected');
      io.emit('loggedIn', connections.length);
    });
    
  });

  /*========================================================================================*
   * Mise à jour d'une relation par un membre (confirmation, refus, suppression)
   *   - mise à jour de la BDD
   *   - récupérer la socketId du membre ami si celui-ci est connecté
   *   - retourner aux 2 amis la relation mise à jour
   *=========================================================================================*/
  socket.on('updateRelation', async function (data) {
    logging('info', base, socket.id, `update relation of ${socket.member.pseudo} from ${data} .`);

    let updatedRelation;

    await relation.wsUpdate(socket.id, data)
      .then(res => {
        updatedRelation = res;
        let friendId = JSON.stringify(socket.member._id) === JSON.stringify(updatedRelation.requester) ? JSON.stringify(updatedRelation.receiver) : JSON.stringify(updatedRelation.requester);
        socket.emit('relationUpdate', updatedRelation);   

        findSocketId(friendId)
        .then((friendSocketId) => {
          if (friendSocketId){
          socket.to(friendSocketId).emit('relationUpdate', updatedRelation);
          } 
        })
      })
      .catch(error => {
        logging('error', base, socket.id, `${updatedRelation._id} updating relation has failed ${error}`); 
        throw error;
      });
   
  });

});


