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

io.on('connection', (socket) => {
  console.log('Nuevo usuario conectado');

  socket.on('message', (data) => {
    io.emit('messageResponse', data); // Emitir el mensaje a todos los clientes
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});