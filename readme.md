# fffuuu

A TCP socket client with transparent reconnection support and message buffering while disconnected.

## Features

TODO: some of the stuff here is not implemented yet.

I'm writing a TCP socket library? Really? (insert rage comic here)

- proper reconnection support with exponential backoff and maximum reconnect limits
- message buffering while disconnected so that the API above doesn't need to worry about temporary disconnects
- retries of failed initial connections (and timeouts on the initial connection)
- long-term two-way TCP sockets, no extra patterns like pubsub on top

and some optional sugar:

- sending JSON payloads from the client
- named RPC endpoints on the server

## State transition diagram for an asynchronous socket client with reconnection support

![diagram](https://github.com/mixu/fffuuu/raw/master/misc/statediagram.png)

## Events

- `"connect"`: when connected (this includes reconnections, so you probably want to use `.once('connect', callback)`)
- `"permanent_disconnect"`: when the automatic reconnection stops retrying
- `"data"`: when raw data is received
- `"message"`: when a JSON message is received

## Client API

- `new Client({ host: hostname, port: port })`: creates a new client
- `connect()`: connect to previously configured address
- `disconnect()`: disconnect, if connected
- `write(data)`: write data; buffered if the socket is not connected
- `send(rpc, message)`: send a JSON message; buffered if the socket is not connected

## Server API

- attach(server): `server` should be an instance of net.createServer(). Attaches a .on('data') handler which parses newline-separated JSON.

## Example

    // if the initial connect fails, then this will work on the next connect
    var client = new Client({ host: 'localhost', port: 8124 }).connect();

    // buffered
    client.send('hello', { foo: 'bar'});

    client.on('data', function(chunk) {
      console.log(chunk.toString());
    });

    var server = net.createServer();
    attach(server);

    server.on('hello', function(message, socket){
      console.log('[S] rcv:', message);
    });

    server.listen(8124);
