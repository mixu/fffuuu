var net = require('net'),
    events = require('events');

var s = {
  permanently_disconnected: -2, // service unavailable or config error
  initial: -1, // disconnected and not looking to connect
  connect_wait: 1, // waiting to reconnect, exponential backoff
  closed: 2, // disconnected for reason other than explicit disconnect()
  disconnect_wait: 3, // actively transitioning to "initial" state
  connect_wait: 4, // actively transitioning to "connected" state
  connected: 5
};

var defBackoff = [1000, 2000, 4000, 8000, 16000, 32000];

function Client(opts) {
  var self = this;
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
  console.log('change state from', this._state, 'to', to);
  this._state = to;
};

Client.prototype.connect = function() {
  if(this._state == s.initial) {
    this._connect();
  }
  this.run();
};

Client.prototype._connect = function() {
  var self = this;
  if(this._state != s.initial && this._state != s.reconnect_wait) {
    console.log('Connect is only allowed from initial and reconnect_wait states.');
    return;
  }
  // detach existing event handlers and attach new event handlers
  function connectionError(err) {
    if(err) {
      console.log('error', err);
    }
    self.set(s.closed);
    self.run();
  }

  var socket = this.socket = new net.Socket();
  socket.setKeepAlive(true);

  socket.on('connect', function() {
    if(self.waitTimer) {
      clearTimeout(self.waitTimer);
      self.waitTimer = null;
    }
    self.set(s.connected);
    self.run();
  });
  socket.on('error', connectionError);
  socket.on('close', connectionError);
  socket.on('end', connectionError);

  // set timeout for connect
  this.waitTimer = setTimeout(function() {
    console.log('connection timed out');
    self.waitTimer = null;
    connectionError();
  }, 7000);

  // actual connect
  socket.connect(this.opts);
  this.set(s.connect_wait);
};

Client.prototype.send = function(endpoint, message) {
  this.socket.write(JSON.stringify([endpoint, message]) + '\n');
};

Client.prototype.disconnect = function() {
  // detach existing event handlers and attach new event handlers
  function closed() {
    self.set(s.initial);
    self.run();
  }
  socket.on('error', closed);
  socket.on('close', closed);
  socket.on('end', closed);

  // set timeout for disconnect
  this.waitTimer = setTimeout(function() {
    console.log('disconnection timed out');
    self.waitTimer = null;
    closed();
  }, 7000);

  // do disconnect
  this.socket.disconnect();
  this.set(s.disconnect_wait);
};

Client.prototype.run = function() {
  switch(this._state) {
    case s.initial:
    case s.connect_wait:
    case s.disconnect_wait:
    case s.reconnect_wait:
      // NOP, either an event will occur or the guard timer will be called
      break;
    case s.connected:
      this.connections++;
      this._cancelGuard();
      console.log('client connected');
      this.emit('connect');
      break;
    case s.closed:
      if(reconnects > maxReconnects) {
        this.set(s.permanently_disconnected);
        this.run();
      } else {
        reconnects++;
        this.set(s.reconnect_wait);
        if(!this.waitTimer) {
          // set timer with exponential backoff
          this.waitTimer = setTimeout(function() {
            self.waitTimer = null;
            self._connect();
          }, exponential);
        }
      }
      break;
    case s.permanently_disconnected:
      this.emit('permanently_disconnected');
      break;
  }
};

module.exports = Client;
