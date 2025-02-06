const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Cambia esto si tu frontend está en otro puerto
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

const users = {}; // Guardar usuarios conectados { socketId: username }

io.on('connection', (socket) => {
  console.log('Nuevo usuario conectado:', socket.id);

  // Registrar usuario cuando se conecta
  socket.on('registerUser', ({ name }) => {
    users[socket.id] = name;
    io.emit('updateUsers', Object.values(users)); // Enviar lista de usuarios actualizada
  });

  // Escuchar mensajes generales
  socket.on('message', (data) => {
    io.emit('messageResponse', data); // Enviar mensaje a todos
  });

  // Escuchar y reenviar mensajes privados
  socket.on('privateMessage', ({ to, message, from }) => {
    const recipientSocketId = Object.keys(users).find(key => users[key] === to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('privateMessageResponse', { from, message });
    }
  });

  //ventana privada de chat
  socket.on("openPrivateChat", ({ recipient, sender }) => {
    socket.to(recipient).emit("openPrivateChat", sender);
  });

  // Desconexión del usuario
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    delete users[socket.id]; // Eliminar usuario desconectado
    io.emit('updateUsers', Object.values(users)); // Enviar lista de usuarios actualizada
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
