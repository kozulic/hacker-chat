#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');

const socket = require('socket.io-client')('http://localhost:8000');

let rooms = [];
let currentRoom = '';

const initSockets = () => {
  socket.on('new connect', username => {
    console.log(chalk.cyan(`User ${chalk.magenta(username)} connected!`));
  });

  socket.on('list rooms', list => {
    rooms = [];
    Object.keys(list).forEach(room => {
      rooms.push(room);
    });
  });

  socket.on('new room',  room => {
    rooms.push(room);
  });

  socket.on('message', msgInfo => {
    console.log(chalk.green(`${chalk.bold(msgInfo.user)}: ${msgInfo.message}`));
  });

  socket.on('user disconnect', username => {
    console.log(chalk.cyan(`User ${chalk.magenta(username)} disconnected!`));
  });
}

const init = () => {
  socket.emit('list rooms');

  inquirer.prompt(
    [
      { type: 'list', name: 'init', message: 'What do you want to do?', choices: [
        'Create chat room',
        'Join chat room'
      ]}
    ]
  ).then(answers => {
    if (answers.init === 'Create chat room') {
      createRoom();
    } else if (answers.init === 'Join chat room') {
      listRooms();
    }
  });
}

const createRoom = () => {
  inquirer.prompt(
    [
      { type: 'input', name: 'name', message: 'Enter chat room name:' }
    ]
  ).then(answers => {
    socket.emit('new room', answers.name);
    init();
  });
}

const listRooms = () => {
  inquirer.prompt(
    [
      { type: 'list', name: 'room', message: 'Choose room', choices: rooms },
      { type: 'input', name: 'username', message: 'Enter username: '}
    ]
  ).then(answers => {
    joinRoom(answers.room, answers.username);
  });
}

const joinRoom = (room, username) => {
  currentRoom = room;
  socket.emit('new user', username, room);

  console.log(`Joined to room: ${chalk.italic(room)}`);
  
  writeMessages();
}

const writeMessages = () => {
  inquirer.prompt(
    [
      { type: 'input', name: 'message', message: `> ` }
    ]
  ).then(answers => {
    if (answers.message === 'exit') {
      init();
    } else {
      socket.emit('message', answers.message, currentRoom);
      writeMessages();
    }
  });
}

program
  .action(() => {
    initSockets();
    init();
  });
 
program.parse(process.argv);
