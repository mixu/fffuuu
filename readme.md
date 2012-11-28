# fffuuu

A TCP socket client with transparent reconnection support and message buffering while disconnected.

Warning: some stuff is not yet implemented, wait until I have the test suite set up.

## Features

"FFFuuu" is how I feel about reinventing the wheel on this particular occasion.

To be honest I'd have preferred to use an existing library, but I couldn't find a good one:

- Reconnection support with exponential backoff (that resets if a connection is established so that single disconnects don't cause lengthening timeouts but consecutive disconnects do exponential backoff)
- The reconnection logic should be a state machine, as state machines are easier to reason about
- Reconnection should apply to the initial connect attempt (e.g. the layer above should not be bothered when ECONNREFUSED occurs)
- Message buffering if disconnected or not yet connected, so that a temporary disconnect doesn't require custom handling in the layer above
- Maximum reconnection limits (e.g. the system should give up after configurable number of reconnects; only permanent failures should be handled in the layer above)
- Timeout guards on connect and disconnect so that slowness at the server-side are detected in addition to regular errors and connection drops.

and some optional sugar:

- sending JSON payloads from the client
- named RPC endpoints on the server

## State transitions done right

So here's what I think a state transition diagram should look like with reconnection timeouts:

![diagram](https://github.com/mixu/fffuuu/raw/master/misc/statediagram.png)

## Events

- `"connect"`: when connected (this includes reconnections, so you probably want to use `.once('connect', callback)`)
- `"permanent_disconnect"`: when the automatic reconnection stops retrying
- `"data"`: when raw data is received
- `"message"`: when a JSON message is received
- `"error"`: TODO when any connection error occurs
- `"close"`: TODO when a connection is closed (this occurs on each disconnect before reconnection kicks in)

## Client API

- `new Client({ host: hostname, port: port })`: creates a new client
- `connect()`: connect to previously configured address
- `disconnect()`: disconnect, if connected
- `write(data)`: write data; buffered if the socket is not connected
- `send(rpc, message)`: send a JSON message; buffered if the socket is not connected

## Client options

Passed to the constructor:

- host:
- port:
- reconnect: [ 1000, 2000, ... ]
- maxReconnects:

## Server API

- attach(server): `server` should be an instance of net.createServer(). Attaches a .on('data') handler which parses newline-separated JSON.

New API:

- .attach()
- .expose(name, callback)


Two parts:

### Connection handling

Readable stream (end, error, close via on() / once() / removeListener() ) + .connect() + .write() + .end()

### Stream parsing

    net.createServer(function (socket) {
      socket.pipe(foo);
    });

+ normal connection API?
+ wrapping sockets that come in from on('connection')


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
