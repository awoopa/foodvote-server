var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

/*var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen();



app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

*/

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));


function Round() {
    this.placeA; // yelp IDs (or similar)
    this.placeB;
    this.votes; // array of objects, each object is user and their vote
}

function Room() {
    this.rounds = [];
    this.name;
    this.uuid = guid();
    this.users = [];

    this.radius;
    this.center;
    this.time;
    this.options = []; // array of all places in consideration, initialized with seed places from client
}

var rooms = {};

io.on('connection', function (socket) {

    /*
    A client enters the room.
    {
      name: ''  ;; the room name that a client intends to join/create
      uuid: ''  ;; the client user's name
    }

    */
    socket.on('join room', function(data) {
        var name = data.name;
        var uuid = data.uuid;

        var exists = false;
        if (rooms[name] != null) {
          var e = rooms[name];
          socket.emit('joined room', {room: e});
          socket.join(e.name);
          e.users.push(uuid);
          socket.emit('test', e);
          io.to(e.name).emit('user joined room', {newUser: uuid, users: e.users});
          exists = true;
          return;
        }

        if (!exists) {
            socket.emit('room available', {name: name, roomAvailable: true});
        }
    });

    /*
     should only ever be called if 'room available' is emitted to client
     to prevent multiple rooms with same name

     {
     name: ''   ; the room's name
     radius: '' ; radius around center
     center: ''
     time: ''   ; time of the meal
     options: []   ; the array of Yelp IDs as search results done by client
     uuid: ''   ; user's details (unique)
      }

     */
    socket.on('creator setup', function(data) {
        var room = new Room();
        socket.join(data.name);

        room.name = data.name;
        room.users.push(data.uuid);
        room.radius = data.radius;
        room.center = data.center;
        room.time = data.time;
        room.options = data.options;

        rooms[data.name] = room;
        socket.emit('room created', data.name);
        socket.emit('test', room);
    });

    /*
    Used to add locations specified by users.
    TODO: add in logic to remove already existing default Yelp ID in
          place of the user's choices.
    {
      name: ''         ; the name of the room
      locations: []    ; the array of Yelp IDs user's choice
    }

    */
    socket.on('add locations', function(data) {
      rooms[data.name].options = rooms[data.name].options.concat(data.locations);
    });
    /*
    when the creator starts the voting.
    {
      name: ''    ; the room's name
    }
    */
    socket.on('creator start', function(data) {
      var room = rooms[data.name];
      /*
        should notify all users in the room that voting begins.
        emit the current room informations (with new Yelp IDs)
      */
      io.to(data.name).emit('user start', room);
      // create a new Round and sends to user:
      var round = new Round();
      // round's place A should be the first item in options
      round.placeA = room.options[0];
      round.placeB = room.options[1];

      room.rounds.push(round);
      /*
      sends the first round information:
      {
        roundNum: 0       ; this is the first round
        rounds: rounds
      }

      */
      io.to(data.name).emit('new round', { roundNum: 0, rounds: round });
      // user should now vote...
    });

    /*
    when user submits a vote for a round:
    {
      room: ''             ; name of the room
      roundNum: 5      ; the round of vote that this user is voting for
      score: -5 < x < 5    ; the score given to this round:
                           ; if score negative (-5) - votes towards A
                           ; if score positive (5)  - votes towards B
                           ; if score 0             - votes neutral
    }
    */

    socket.on('user vote', function (data) {
      var roomName = data.name;
      
    });


    console.log('a user connected');

});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}


server.listen(app.get('port'));
