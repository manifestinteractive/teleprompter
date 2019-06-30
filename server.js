var app = require('express')();
var express = require('express');
var path = require('path');
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use('/css', express.static(path.join(__dirname, 'css')))
app.use('/font', express.static(path.join(__dirname, 'font')));
app.use('/img', express.static(path.join(__dirname, 'img')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/remote.html');
});

io.on('connection', function(socket) {
    socket.on('connectToRemote', function(id) {
        socket.room = id;
        socket.join(id);
        socket.emit('connectedToRemote', id);
        socket.broadcast.to(id).emit('connectedToRemote', id);
    });

    socket.on('sendRemoteControl', function(command) {
        socket.emit('remoteControl', command);
        socket.broadcast.to(socket.room).emit('remoteControl', command);
    });

    socket.on('clientCommand', function(command, value) {
        socket.emit('clientCommand', command, value);
        socket.broadcast.to(socket.room).emit('clientCommand', command, value);
    });
});

http.listen(3000, function() {});