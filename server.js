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
    const recipientSocketId = Object.keys(users).find((key) => users[key] === to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('privateMessageResponse', { from, message });
    }
  });

  // Escuchar y reenviar archivos en el chat general
  socket.on('fileUpload', (data) => {
    io.emit('fileResponse', data); // Enviar archivo a todos
  });

  // Escuchar y reenviar archivos en chats privados
  socket.on('privateFileUpload', ({ to, file, fileName, from }) => {
   
    // Enviar el archivo al destinatario
    const recipientSocketId = Object.keys(users).find((key) => users[key] === to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('privateFileResponse', {
        from, // El remitente es quien envió el archivo
        file,
        fileName,
        to, // Indicar el destinatario
      });
    } else {
      console.log(`Usuario ${to} no encontrado.`);
    }
  
    // Enviar el archivo de vuelta al remitente
    const senderSocketId = Object.keys(users).find((key) => users[key] === from);
    if (senderSocketId) {
      io.to(senderSocketId).emit('privateFileResponse', {
        from, // El remitente es quien envió el archivo
        file,
        fileName,
        to, // Indicar el destinatario
      });
    }
  });

  // Abrir ventana privada de chat
  socket.on('openPrivateChat', ({ recipient, sender }) => {
    const recipientSocketId = Object.keys(users).find((key) => users[key] === recipient);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('openPrivateChat', sender);
    }
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