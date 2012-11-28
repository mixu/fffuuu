var net = require('net'),
    events = require('events');

var attach = require('./server.js'),
    Client = require('./client.js');

var client = new Client();

client.once('connect', function() {
  client.send('hello', { foo: 'bar'});
});

client.on('data', function(chunk) {
  console.log(chunk.toString());
});

client.connect(8124);


var client2 = new Client();

client2.once('connect', function() {
  client2.send('hello', { foo: 'bar'});
});

client2.on('data', function(chunk) {
  console.log(chunk.toString());
});

client2.connect(8123);


var server = net.createServer();
attach(server);

server.on('hello', function(message, socket){
  console.log('event', message);
});

server.listen(8124);
