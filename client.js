var net = require('net'),
    events = require('events');

var s = {
  permanently_disconnected: -2, // service unavailable or config error
  initial: -1, // disconnected and not looking to connect
  reconnect_wait: 1, // waiting to reconnect, exponential backoff
  closed: 2, // disconnected for reason other than explicit disconnect()
  disconnect_wait: 3, // actively transitioning to "initial" state
  connect_wait: 4, // actively transitioning to "connected" state
  connected: 5
};

function lookup(state) {
  var match = state;
  Object.keys(s).forEach(function(k) {
    if(s[k] == state) {
      match = k;
    }
  });
  return match;
}



var defBackoff = [1000, 2000, 4000, 8000, 16000, 32000],
    maxReconnects = defBackoff.length - 1;

function Client(opts) {
  var self = this;
  this.reconnects = 0;
  // TCP socket
  this.socket = null;
  // current state
  this._state = s.initial;
  // timer for waiting
  this.timer = null;
  this.opts = opts;
};

require('util').inherits(Client, events.EventEmitter);

Client.prototype.set = function(to) {
  console.log('change state from', lookup(this._state), 'to', lookup(to));
  this._state = to;
};

Client.prototype.connect = function() {
  if(this._state == s.initial) {
    this._connect();
  }
  this.run();
};

Client.prototype._clearListener = function(fn) {
  this.socket.removeListener('error', fn);
  this.socket.removeListener('close', fn);
  this.socket.removeListener('end', fn);
  if(this.waitTimer) {
    clearTimeout(this.waitTimer);
    this.waitTimer = null;
  }
};

Client.prototype._connect = function() {
  var self = this;
  if(this._state != s.initial && this._state != s.reconnect_wait) {
    console.log('Connect is only allowed from initial and reconnect_wait states.');
    return;
  }
  // detach existing event handlers and attach new event handlers
  function connected() {
    self._clearListener(connectionError);
    self.set(s.connected);
    self.run();
  }
  function connectionError(err) {
    if(err) {
      console.log('error', err);
    }
    self.socket.removeListener('connect', connected);
    self._clearListener(connectionError);
    self.set(s.closed);
    self.run();
  }

  var socket = this.socket = new net.Socket();
  socket.setKeepAlive(true);

  socket.once('connect', connected);
  socket.once('error', connectionError);
  socket.once('close', connectionError);
  socket.once('end', connectionError);

  // set timeout for connect
  this.waitTimer = setTimeout(function() {
    console.log('connection timed out');
    connectionError();
  }, 7000);

  // actual connect
  socket.connect(this.opts.port, this.opts.host);
  this.set(s.connect_wait);
};

Client.prototype.send = function(endpoint, message) {
  this.socket.write(JSON.stringify([endpoint, message]) + '\n');
};

Client.prototype.disconnect = function() {
  // detach existing event handlers and attach new event handlers
  function closed() {
    self._clearListener(closed);
    self.set(s.initial);
    self.run();
  }
  socket.once('error', closed);
  socket.once('close', closed);
  socket.once('end', closed);

  // set timeout for disconnect
  this.waitTimer = setTimeout(function() {
    console.log('disconnection timed out');
    closed();
  }, 7000);

  // do disconnect
  this.socket.disconnect();
  this.set(s.disconnect_wait);
};

Client.prototype.run = function() {
  var self = this;
  switch(this._state) {
    case s.initial:
    case s.connect_wait:
    case s.disconnect_wait:
    case s.reconnect_wait:
      // NOP, either an event will occur or the guard timer will be called
      break;
    case s.connected:
      console.log('client connected');
      this.reconnects = 0;
      this.emit('connect');
      this.socket.on('data', function() {
        self.emit.apply(self, Array.prototype.slice(args));
      });
      break;
    case s.closed:
      if(this.reconnects > maxReconnects) {
        this.set(s.permanently_disconnected);
        this.run();
      } else {
        this.set(s.reconnect_wait);
        if(!this.waitTimer) {
          console.log('reconnect in', defBackoff[Math.min(this.reconnects, defBackoff.length - 1)]);
          // set timer with exponential backoff
          this.waitTimer = setTimeout(function() {
            self.waitTimer = null;
            self._connect();
          }, defBackoff[Math.min(this.reconnects, defBackoff.length - 1 )]);
        }
      }
      this.reconnects++;
      break;
    case s.permanently_disconnected:
      this.emit('permanently_disconnected');
      break;
  }
};

module.exports = Client;
