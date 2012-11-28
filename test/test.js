var assert = require('assert');


exports['given a client and a server thats down'] = {

  'calling send() and write() before .connect() buffer messages and do not cause errors': function() {

  },

  'if the server is down, then reconnects are attempted': function() {

  },

  'when connected, connect is emitted': function() {

  },

  'connections, reconnections and disconnects that hang should be detected after 7 seconds': function() {

  },

  'seven failures should cause a permanent disconnect': function(done) {
    var b = this.b;
    b.increment();
    b.increment();
    b.increment();
    b.increment();
    b.increment();
    b.increment();
    b.increment();
    assert.equal(b.get(), 99999000);
    done();
  },

  'the permanent disconnect can be reset by calling disconnect() followed by connect() after which connecting can succeed normally': function() {

  }
};

exports['given a client and a server thats up'] = {

  'can listen to messages addressed to a specific RPC resource from the server': function() {

    client.once('foo', function() {

    });
  },

  'can write raw messages': function() {

  },

  'can send JSON messages to a specific RPC resource': function() {

  },

  'receiving non-JSON does not cause problems with the JSON decoder': function() {

  },

  'if the user calls disconnect, emit disconnected and do not reconnect': function() {

  },

  'successful connection resets durations so that a random error doesnt cause a long wait': function(done) {
    var b = this.b;
    assert.equal(b.get(), 1000);
    b.increment();
    assert.ok(b.get() > 1000);
    b.success();
    assert.equal(b.get(), 1000);
    done();
  },

};

exports['API abuse'] = {

  'calling connect twice should not cause two connections': function() {

  },

  'calling disconnect in any state other than connected should not cause issues': function() {

    // 1. initial => NOP
    // 2. connect_wait => cancel connect
    // 3. reconnect_wait => cancel wait, move to initial
    // 4. closed => reset and move to initial
    // 5. permanently disconnected =>
    // 6. connected => start wait, move to disconnect_wait
    // 7. disconnect_wait => NOP

  }

};


exports['error transitions'] = {

  'an error, close or end during connect_wait should move to closed': function() {

  },

  'an error, close or end during connected should move to closed': function() {
    // TODO this is not handled, no listeners
  },

  'an error, close or end during disconnect_wait should move to initial': function() {

  },


};


// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}
