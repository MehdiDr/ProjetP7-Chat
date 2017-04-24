var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var loggedUser;
var users = [];

app.use("/", express.static(__dirname + "/public"));

io.on('connection', function(socket) {
  console.log('a user connected'); //pour savoir quand un utilisateur arrive

  for (i = 0; i < users.length; i++) {
    socket.emit('user-login', users[i]);
  };

  socket.on('user-login', function(loggedUser) { //login
    console.log('user logged in : ' + loggedUser.username);
    user = loggedUser;
    socket.on('chat-message', function(message) { //chat avec nom d'utilisateur
      message.username = loggedUser.username;
      io.emit('chat-message', message);
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
      if (user !== undefined && userIndex === -1) { // S'il est bien nouveau
        // Sauvegarde de l'utilisateur et ajout à la liste des connectés
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
        // Emission de 'user-login' et appel du callback
        io.emit('user-login', loggedUser);
        callback(true);
      }
      else {
        callback(false);
      }
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
      // Emission d'un 'user-logout' contenant le user
        io.emit('user-logout', loggedUser);
      }
    });
});

http.listen(8080, function() {
    console.log('Server is listening on *:8080');
});
