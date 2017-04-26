var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var loggedUser;
var users = [];
var messages = [];
var typingUsers = [];

app.use("/", express.static(__dirname + "/public"));

io.on('connection', function(socket) {
  //pour savoir quand un utilisateur arrive
  console.log('a user connected');
  // boucle pour ajouter les users dans le tableau
  for (i = 0; i < users.length; i++) {
    socket.emit('user-login', users[i]);
  };
  // boucle pour ajouter les messages dans le tableau pour que la conversation ne soit pas bloquée
  for (i = 0; i < messages.length; i++) {
    if (messages[i].username !== undefined) {
      socket.emit('chat-message', messages[i]);
    } else {
      socket.emit('service-message', messages[i]);
    }
  }

// Pour logger le nouvel utilisateur
  socket.on('user-login', function(loggedUser) {
    console.log('user logged in : ' + loggedUser.username);
    user = loggedUser;
    socket.on('chat-message', function (message) {
      message.username = loggedUser.username;
      io.emit('chat-message', message);
      messages.push(message);
      if (messages.length > 150) {
        messages.splice(0, 1);
      }
    });
  });
  socket.on('user-login', function(user, callback) {
    // Vérification que l'utilisateur n'existe pas
    var userIndex = -1;
    for (i = 0; i < users.length; i++) {
      if (users[i].username === user.username) {
        userIndex = i;
      }
    }
      if (user !== undefined && userIndex === -1) { // S'il est bien nouveau, Sauvegarde de l'utilisateur et ajout à la liste des connectés
        loggedUser = user;
        users.push(loggedUser);
        // Envoi des messages de service
        var userServiceMessage = {
          text: 'You logged in as "' + loggedUser.username + '"',
          type: 'login'
        };
        var broadcastedServiceMessage = {
          text: 'User "' + loggedUser.username + '" logged in',
          type: 'login'
        };
        socket.emit('service-message', userServiceMessage);
        socket.broadcast.emit('service-message', broadcastedServiceMessage);
        messages.push(broadcastedServiceMessage);
        io.emit('user-login', loggedUser);
        callback(true);
      }
      else {
        callback(false);
      }
    });

// L'utilisateur commence à taper
  socket.on('start-typing', function () {
   // Ajout du user à la liste des utilisateurs en cours de saisie
   if (typingUsers.indexOf(loggedUser) === -1) {
     typingUsers.push(loggedUser);
   }
  io.emit('update-typing', typingUsers);
  });

// L'utilisateur arrête de taper
  socket.on('stop-typing', function () {
    var typingUserIndex = typingUsers.indexOf(loggedUser);
    if (typingUserIndex !== -1) {
      typingUsers.splice(typingUserIndex, 1);
    }
    io.emit('update-typing', typingUsers);
  });


  socket.on('disconnect', function() {
    if (loggedUser !== undefined) {
      // Broadcast d'un 'service-message'
      var serviceMessage = {
        text: 'User "' + loggedUser.username + '" disconnected',
        type: 'logout'
      };
      socket.broadcast.emit('service-message', serviceMessage);
      // Suppression de la liste des connectés
      var userIndex = users.indexOf(loggedUser);
      if (userIndex !== -1) {
        users.splice(userIndex, 1);
      }
      messages.push(serviceMessage);
      // Emission d'un 'user-logout' contenant le user
      io.emit('user-logout', loggedUser);
    }
    // Si l'utilisateur se deconnecte pendant qu'il écrit, le supprimer de la liste d'utilisateurs
    var typingUserIndex = typingUsers.indexOf(loggedUser);
    if (typingUserIndex !== -1) {
      typingUsers.splice(typingUserIndex, 1);
    }
  });
});

http.listen(8080, function() {
    console.log('Server is listening on *:8080');
});
