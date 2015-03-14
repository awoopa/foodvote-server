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

var rooms = [];

io.on('connection', function (socket) {
    socket.on('join room', function(data) {
        var name = data.name;
        var uuid = data.uuid;

        var exists = false;
        rooms.forEach(function(e) {
            if (e.name == name) {
                socket.emit('joined room', {room: e});
                socket.join(e.name);
                e.users.push(uuid);
                socket.emit('test', e);
                io.to(e.name).emit('user joined room', {newUser: uuid, users: e.users});
                console.log(e);
                console.log('user joined ' + e.name);
                exists = true;
                return;
            }
        })

        if (!exists) {
            socket.emit('room available', {name: name});
        }
    });

    // should only ever be called if 'room available' is emitted to client
    // to prevent multiple rooms with same name
    socket.on('creator setup', function(data) {
        var room = new Room();
        socket.join(data.name);

        room.name = data.name;
        room.users.push(data.uuid);
        room.radius = data.radius;
        room.center = data.center;
        room.time = data.time;
        room.options = data.options;

        rooms.push(room);
        socket.emit('room created', data.name);
        socket.emit('test', room);
    });

    socket.on('creator start', function(data) {
        io.to(data.name).emit('user start', {name: data.name});
    });

    socket.on('add location', function(data) {

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