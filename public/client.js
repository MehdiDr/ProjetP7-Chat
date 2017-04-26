/*jslint browser: true*/
var socket = io();
var typingTimer;
var isTyping = false;

function scrollToBottom() {
  if ($(window).scrollTop() + $(window).height() + 2 * $('#messages li').last().outerHeight() >= $(document).height()) {
    $("html, body").animate({ scrollTop: $(document).height() }, 0);
  }
};

$('form').submit(function(e) {
  e.preventDefault();
  var message = {
    text : $('#m').val()
  }
  socket.emit('chat-message', message);
  $('#m').val('');
  $('chat-input').focus();
});

$('#login form').submit(function (e) {
  e.preventDefault();
  var user = {
    username : $('#login input').val().trim()
  };
  if (user.username.length > 0) { // Si le champ de connexion n'est pas vide
  socket.emit('user-login', user, function (success) {
    if (success) {
      $('body').removeAttr('id'); // Cache formulaire de connexion
      $('#chat input').focus(); // Focus sur le champ du message
    }
  });
}
});

// Affiche le message sur le chat
socket.on('chat-message', function(message){
  $('#messages').append($('<li>').html('<span class="username">' + message.username + '</span>' + message.text));
  scrollToBottom();
});
// Affiche le message de service sur le chat
socket.on('service-message', function (message) {
  $('#messages').append($('<li class="' + message.type + '">').html('<span class="info">information</span> ' + message.text));
  scrollToBottom();
});

// Savoir si un utilisateur est en train d'écrire
$('#m').keypress(function () {
  clearTimeout(typingTimer);
  if (!isTyping) {
    socket.emit('start-typing');
    isTyping = true;
  }
});
// Mettre à jour s'il arrête d'écrire
$('#m').keyup(function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(function () {
    if (isTyping) {
      socket.emit('stop-typing');
      isTyping = false;
    }
  }, 200);
});
// mettre à jour l'UI, gestion de saisie des autres utilisateurs
socket.on('update-typing', function (typingUsers) {
  $('#users li span.typing').hide();
  for (i = 0; i < typingUsers.length; i++) {
    $('#users li.' + typingUsers[i].username + ' span.typing').show();
  }
});

// Connexion d'un utilisateur
socket.on('user-login', function (user) {
  $('#users').append($('<li class="' + user.username + ' new">').html(user.username + '<span class="typing">typing</span>'));
  setTimeout(function () {
    $('#users li.new').removeClass('new');
  }, 1000);
});
// Deconnexion d'un utilisateur
socket.on('user-logout', function (user) {
  var selector = '#users li.' + user.username;
  $(selector).remove();
});
