# fffuuu

A TCP socket client with transparent reconnection support and message buffering while disconnected.

## Features

I'm writing a TCP socket library? Really? (insert rage comic here)

- proper reconnection support with exponential backoff and maximum reconnect limits
- message buffering while disconnected so that the API above doesn't need to worry about temporary disconnects
- retries of failed initial connections (and timeouts on the initial connection)
- long-term two-way TCP sockets, no extra patterns like pubsub on top

and some optional sugar (you can optionally attach these handlers to add JSON payload sending on top):

- sending JSON payloads from the client
- named RPC endpoints on the server

## State transition diagram for an asynchronous socket client with reconnection support

![diagram](https://github.com/mixu/fffuuu/raw/master/misc/statediagram.png)

## API

    var client = new Wrap();

    client.once('connect', function() {
      client.send('hello', { foo: 'bar'});
    });

    client.connect(8124, { reconnect: [1000, 2000, 4000, 8000, 16000, 32000] });


    server.on('foo', function(message, client) {

    });

