var net = require('net'),
    events = require('events');

var attach = require('./server.js'),
    Client = require('./client.js');

// if the initial connect fails, then this will work on the next connect
var client = new Client({ host: 'localhost', port: 8124 }).connect();

// buffered
client.send('hello', { foo: 'bar'});

client.on('data', function(chunk) {
  console.log(chunk.toString());
});


var client2 = new Client({ port: 8123 });

client2.once('connect', function() {
  client2.send('hello', { foo: 'bar'});
});

client2.on('data', function(chunk) {
  console.log(chunk.toString());
});

client2.connect();


var server = net.createServer();
attach(server);

server.on('hello', function(message, socket){
  console.log('[S] rcv:', message);
});

setTimeout(function() {
  server.listen(8124);
}, 3000);
