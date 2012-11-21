var states = {
  permanently_disconnected: -2, // service unavailable or config error
  // Disconnect states
  stopped: -1, // disconnected and not looking to connect
  waiting: 1, // waiting to reconnect, exponential backoff
  reconnect: 2, // disconnected for reason other than explicit disconnect()
  disconnecting: 3, // actively transitioning to "stopped" state
  // Connect states
  connecting: 4, // actively transitioning to "connected" state
  connected: 5, // connected but still need to resync etc.
  ready: 6 // connected and any lost subs/syncs re-established
};

function Wrap(client) {
  var self = this;
  this.socket = client;
  client.setKeepAlive(true);

  client.on('connect', function() {
    console.log('client connect');
    self.emit('connect');
  });

  client.on('data', function(chunk) {
    console.log(chunk.toString());
  });

  client.on('error', function(err) {

    console.log('client error', err);
  });

  client.on('close', function(hadError) {
    console.log('client close', hadError);
  });

  client.on('end', function() {
    console.log('client disconnected');
  });

};

require('util').inherits(Wrap, events.EventEmitter);

Wrap.prototype.send = function(endpoint, message) {
  this.socket.write(JSON.stringify([endpoint, message]) + '\n');
};

Wrap.prototype.disconnect = function() {
  this.socket.removeListener('error')
};

Wrap.prototype.run = function() {
  switch(this._state) {
    case s.permanently_disconnected:
      this.sink.emit('unavailable');
      break;
    case s.stopped:
      this.sink.emit('disconnected');
      break;
    case s.waiting:

      break;
    case s.reconnect:
      this._connect(this.socketConfig);
      break;
    case s.disconnecting:
    case s.connecting:
      // if we are connecting/disconnecting, set a timeout to check again later
      this.retransition(1000);
      break;
    case s.connected:
      this._cancelGuard();
      this.reconnector.restore(function() {
        self.set(s.ready);
        self.run();
      });
      break;
    case s.ready:
      this.connections++;
      this.backoff.success();
      if(this.connections == 1) {
        this.sink.emit('connected');
      } else {
        this.sink.emit('reconnected');
      }
      this.sink.emit('ready');
      break;
  }
};

Wrap.prototype.transition = function(timeout) {
  var self = this;
  this._timeout = timeout;
  if(!this.transitionTimer) {
    this.transitionTimer = setTimeout(function() {
      self.transitionTimer = null;
      log.info('Ran transition after', timeout);
      self.run();
    }, timeout);
  }
};

module.exports = Wrap;
