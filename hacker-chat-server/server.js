const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const chalk = require('chalk');

const PORT = 8000;

// Object that hold rooms
const rooms = {};
let userCounter = 0;

io.on('connection', (socket) => {
  console.log(chalk.green(`${chalk.grey(new Date().toLocaleString())} New user connected! Total clients: ${++userCounter}`));

  // Join user to room
  socket.on('new user', (username, room) => {
    socket.join(room);
    rooms[room].users[socket.id] = username;
    socket.to(room).broadcast.emit('new connect', username);
  });

  // Emit list of rooms
  socket.on('list rooms', () => {
    socket.emit('list rooms', rooms);
  });

  // Handle new room creation
  socket.on('new room', (room) => {
    rooms[room] = { users: {} };
    io.emit('new room', room);
  });

  // Handle room messaging
  socket.on('message', (message, room) => {
    socket.to(room).broadcast.emit('message', { user: rooms[room].users[socket.id], message });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(chalk.red(`${chalk.grey(new Date().toLocaleString())} User disconnected! Total clients: ${--userCounter}`));
    userRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user disconnect', rooms[room].users[socket.id]);
      delete rooms[room].users[socket.id];
    });
  });
});

// Helper function used to retreive users from rooms
const userRooms = (socket) => {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) {
      names.push(name);
    }
    return names;
  }, []);
};

server.listen(PORT, () => {
  console.log(`Server listening on port ${chalk.blue(PORT)}!`);
})
