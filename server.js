var app = require('express')();
var cors = require('cors');
var express = require('express');
var path = require('path');
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});

app.use(cors({ origin: '*' }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/remote.html');
});

io.on('connection', function(socket) {
  socket.on('connectToRemote', function(id) {
    socket.room = id;
    socket.join(id);
    socket.emit('connectedToRemote', id);
    socket.broadcast.to(id).emit('connectedToRemote', id);
  });

  socket.on('sendRemoteControl', function(command, value) {
    socket.emit('remoteControl', command, value);
    socket.broadcast.to(socket.room).emit('remoteControl', command, value);
  });

  socket.on('clientCommand', function(command, value) {
    socket.emit('clientCommand', command, value);
    socket.broadcast.to(socket.room).emit('clientCommand', command, value);
  });
});

http.listen(3000, function() {});
