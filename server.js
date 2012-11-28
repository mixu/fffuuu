var net = require('net'),
    events = require('events');

function attach(server) {
  server.on('connection', function(socket) {
    console.log('server connection');
    var buffer = '';
    socket.setEncoding('utf8');

    // attach the .send() method
    socket.send = function(endpoint, message) {
      socket.write(JSON.stringify([endpoint, message]) + '\n');
    };
    // attach a data handler to the socket
    socket.on('data', function(chunk) {
      buffer += chunk;
      if(buffer.indexOf('\n') > -1) {
        var parts = buffer.split('\n');
        parts.forEach(function(part) {
          var message = '';
          try {
            message = JSON.parse(part);
          } catch(e) {
            return;
          }
          if(Array.isArray(message)) {
            console.log('emit', message);
            server.emit(message[0], message[1], socket);
          }
        });
        buffer = parts[parts.length -1 ];
      }
    });

  });
};

module.exports = attach;
