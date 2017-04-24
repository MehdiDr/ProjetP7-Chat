/*jslint browser: true*/
const socket = io();

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
socket.on('chat-message', function(message){
  $('#messages').append($('<li>').html('<span class="username">' + message.username + '</span>' + message.text));
  scrollToBottom();
});

socket.on('service-message', function (message) {
  $('#messages').append($('<li class="' + message.type + '">').html('<span class="info">information</span> ' + message.text));
  scrollToBottom();
});
  // Connexion d'un utilisateur
  socket.on('user-login', function (user) {
    $('#users').append($('<li class="' + user.username + ' new">').html(user.username));
      setTimeout(function () {
        $('#users li.new').removeClass('new');
      }, 1000);
    });
    // Deconnexion d'un utilisateur
    socket.on('user-logout', function (user) {
      var selector = '#users li.' + user.username;
      $(selector).remove();
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
