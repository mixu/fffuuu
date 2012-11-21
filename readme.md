# arrgh

What I want:


- invisible reconnection support
- retry failed initial connection if server is not yet up
- don't hide the underlying Node API, I like it
- long-term two-way TCP sockets, no extra patterns like pubsub on top
- sending JSON payloads from the client
- named RPC endpoints on the server

## API

    var client = new Wrap(new net.Socket());

    client.once('connect', function() {
      client.send('hello', { foo: 'bar'});
    });

    client.connect(8124, { reconnect: [1000, 2000, 4000, 8000, 16000, 32000] });


    server.on('foo', function(message, client) {

    });

