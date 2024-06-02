const express = require('express')
const socketIo = require('socket.io')
const http  = require('http')
//const getUserDetailsFromToken = require('./helpers/getUserDetailsFromToken')
//const UserModel = require('./models/UserModel')
//const { ConversationModel,MessageModel } = require('./models/ConversationModel')
//const getConversation = require('./helpers/getConversation')

//const io = socketIo(server);

const app = express();
const server = http.createServer(app);
const mongoose = require('mongoose');
const connectDB = require('./config/connectDB')

require('dotenv').config()

const io = socketIo(server, {
    cors: {
        origin: "http://localhost", // The origin of your PHP/NGINX server
        methods: ["GET", "POST"]
    }
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 메시지 스키마 및 모델 정의
const messageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  user: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
});

const Message = mongoose.model('Message', messageSchema);



io.on('connection', (socket) => {
  console.log('a user connected');

  // 방 참여 처리
  socket.on('join room', async (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);

    // 해당 방의 이전 메시지 로드
    try {
      const messages = await Message.find({ room }).sort('timestamp').exec();
      socket.emit('load messages', messages);
    } catch (err) {
      console.error(err);
    }

  });

  // 클라이언트로부터 메시지 수신
  socket.on('chat message', (msg) => {
    const message = new Message(msg);
    message.save().then(() => {
      io.in(msg.room).emit('chat message', msg);
      //socket.to(msg.room).emit('chat message', msg);

    });
  });


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
connectDB().then(()=>{
    server.listen(3000, () => {
        console.log('listening on *:3000');
    });
})


