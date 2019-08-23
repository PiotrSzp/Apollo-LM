var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

let scores = [];

app.get('/socket.io/socket.io.js', function (req, res) {
    res.sendFile(__dirname + '/socket.io/socket.io.js');
});
app.get('/\*', function (req, res) {
    res.sendFile(__dirname + req.url);
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('score_submit', function (pilot, score) {
        scores.push({ pilot, score });
        console.log(scores);

        io.emit('score_emit', scores)

    })
});

http.listen(3002, function () {
    console.log('listening on *:3002');
});