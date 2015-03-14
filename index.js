var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

function Round() {
    this.placeA; // yelp IDs (or similar)
    this.placeB;
    this.votes = []; // array of objects, each object is user and their vote
}

function User(socketId, name) {
    this.socketId = socketId;
    this.userName = name;
}

function Room() {
    this.roomId = guid();
    this.roomName;
    this.rounds = [];
    this.users = {};

    this.radius;
    this.center;
    this.time;
    this.options = []; // array of all places in consideration, initialized with seed places from client
}

var rooms = {};

io.on('connection', function (socket) {
  var user = null;
  var room = null;
  /*
  A client enters the room.
  {
    room_name: ''  ;; the room name that a client intends to join/create
    user_name: ''  ;; the client user's name
  }
  specify a call back:
  function callback(roomExists: boolean) { ... }
  */
  socket.on('join room', function (data) {
    var roomName = data.room_name;
    var userName = data.user_name;
    // check if either is empty
    if (!roomName || !userName)
      return;

    user = new User(socket.id, userName);
    // Case: roomName exists
    if (rooms[roomName] != null) {
      room = rooms[roomName];
      socket.join(room.roomName);
      // emits to this socket when room is joined
      // {
      //    room: {}     ; current room
      // }
      socket.emit('joined room', { room: room });
      room.users[user.socketId] = user;
      // emits to all in this room
      // {
      //    new_user: {}
      //    all_users: []
      // }
      io.to(room).emit('user joined room', {
        new_user: user,
        all_users: room.users
      });
    }
    else
    // Case: roomName does not exists
    {
      socket.emit('room available', { room_name: roomName });
    }
  });
  /*
   should only ever be called if 'room available' is emitted to client
   to prevent multiple rooms with same name

   {
   room_name: ''   ; the room's name
   radius: '' ; radius around center
   center: ''
   time: ''   ; time of the meal
   options: []   ; the array of Yelp IDs as search results done by client
    }

    emits "room created" event when done
   */
  socket.on('creator setup', function(data) {
    if (rooms[data.roomName] != null) return;
    if (!user) return;

    room = new Room();
    room.roomName = data.room_name;
    room.radius = data.radius;
    room.center = data.center;
    room.time = data.time;
    room.options = data.options;
    room.users[user.socketId] = user;

    rooms[data.room_name] = room;

    socket.join(room.roomName);

    socket.emit('room created', { room: room });
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
    if (!room || !user) return;

    room.options = room.options.concat(data.locations);
  });

  socket.on('creator start', function (data) {
    if (!room || !user) return;
    /*
      should notify all users in the room that voting begins.
      emit the current room informations (with new Yelp IDs)
    */
    io.to(room.roomName).emit('voting start', room);

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
      this_round: rounds
    }

    */
    io.to(room.roomName).emit('new round', { roundNum: 0, this_round: round });
    // user should now vote...
  });
});




/// Utility functions

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
