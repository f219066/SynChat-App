var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const socketIds = {};
app.use(express.static('public'));

var users = {}; // To store the socket ID of each user ok

io.on('connection', function(socket) {

    console.log('A user connected with socket ID:', socket.id);

    socket.on('userLoggedIn', function(user) {
        
        users[user] = socket.id; // Store the user's socket ID

        io.emit('newUser', user);
        io.emit('getActiveUsersForStatus');
    });

    socket.on('getActiveUsersForStatus', function() {
        console.log('Updating status for:', Object.keys(users)); // Add this line
        io.emit('updateStatus', Object.keys(users));
    });
    

    socket.on('getActiveUsers', function() {
        socket.emit('activeUsers', Object.keys(users)); // Send the list of active users
    });

    
    // Listen for 'message' events
    socket.on('message', function(data) {
        console.log('Received message: ', data);
        var recipientSocketId = users[data.recipient];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('message', data); // Send the message to the recipient
        }
    });

    socket.on('image', function(data) {
        console.log('Received image:', data.imageUrl);
        var recipientSocketId= users[data.recipient];
        io.sockets.sockets.forEach((socket) => {
            if (socket.username === data.recipient) {
                recipientSocketId = socket.id;
            }
        });
    
        if (recipientSocketId) {
            console.log('Emitting image to recipient');
            io.to(recipientSocketId).emit('image', data); // Send the image to the recipient
        } else {
            console.log('Recipient not found');
        }
    });
    


     // Listen for 'voice' events
     socket.on('voice', function(data) {
        console.log('Received voice:', data.voice);
        var recipientSocketId = users[data.recipient];
        if (recipientSocketId) {
            console.log('Emitting voice to recipient');
            io.to(recipientSocketId).emit('voice', data); // Send the voice to the recipient
        } else {
            console.log('Recipient not found');
        }
    });


    socket.on('file', function(data) {
        console.log('Received file event with data:', data); // Log the received data
    
        var recipientSocketId = users[data.recipient];
        if (recipientSocketId) {
            console.log('Emitting file to recipient:', data.recipient); // Log the recipient's username
            io.to(recipientSocketId).emit('file', data); // Send the file to the recipient
        } else {
            console.log('Recipient not found:', data.recipient); // Log the recipient's username
        }
    });
    

  




    socket.on('disconnect', function() {
        // Remove the disconnected user from the 'users' object
        for (var user in users) {
            if (users[user] === socket.id) {
                delete users[user];
                io.emit('userDisconnected',user);
                io.emit('getActiveUsersForStatus'); 
            }
        }
    });
});


server.listen(3000, function() {
    console.log('Server is listening on port 3000');
});