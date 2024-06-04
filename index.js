const express = require('express')
const socketIo = require('socket.io')
const http = require('http')
//const getUserDetailsFromToken = require('./helpers/getUserDetailsFromToken')
//const UserModel = require('./models/UserModel')
//const { ConversationModel,MessageModel } = require('./models/ConversationModel')
//const getConversation = require('./helpers/getConversation')

const { ChannelModel, ChannelMemberModel, MessageModel } = require('./models/ChannelModel');

const mongoose = require('mongoose');
const connectDB = require('./config/connectDB');

const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
//const { Channel } = require('diagnostics_channel');
const socketUpload = require("socketio-file-upload");
const md5 = require("md5");

const app = express().use(express.static(__dirname + '/')).use(socketUpload.router);
const server = http.createServer(app);
require('dotenv').config()

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();


Promise.all([
  pubClient.connect(),
  subClient.connect()
]);

const io = socketIo(server, {
  adapter: createAdapter(pubClient, subClient),
  cors: {
    origin: "http://localhost", // The origin of your PHP/NGINX server
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 메시지 스키마 및 모델 정의


/**
 *  action:
 *   - change channel
 *   - init
 *   - create channel
 *   - chat message
 *
 *
 *
 **/
io.on('connection', (socket) => {
  console.log(__dirname);
  console.log('a user connected');
  console.log(socket.id);

  // file upload
  let uploader = new socketUpload();
  uploader.dir = __dirname+"/static";
  uploader.listen( socket );
  uploader.on("saved", function(event) {
      console.log(event.file);
  });
  uploader.on("error", function(event) {
    
    console.log(__dirname);
    console.log("Error from uploader", event);
  });

  // 방 참여 처리
  socket.on('change channel', async (data) => {
    //  channelmember 에 추가
    try {
      const result = await ChannelMemberModel.findOne({
        channel_id: data?.channel_id,
        user_id: data?.user_id
      });
      console.log(data);
      if (result) {
        console.log('Channel member found:', result);
      } else {
          /*
            const newChannelMember = new ChannelMemberModel({
                channel_id: data.channel_id,
                user_id: data.user_id
            });

            result = await newChannelMember.save();
            */
      }
    } catch (err) {
      console.error('Error finding channel member:', err);
    }
    socket.join(data.channel_id);
    console.log(`User joined channel: ${data.channel_id}`);
    // 해당 방의 이전 메시지 로드
    try {
      const messages = await MessageModel.find({ channel_id:data.channel_id }).sort('timestamp').exec();
      socket.emit('load messages', messages);
    } catch (err) {
      console.error(err);
    }

  });

  //  init 
  socket.on('init', async (data) => {

    let user_id = data.user_id;
    //let channel_id = data.channel_id;
    try {
      const channels = await ChannelModel.find({ user_id: data?.user_id }).exec();
      let channelDtos = new Array();
    
      console.log("init");
      console.log(channels);

      channels.forEach((value)=>{
        channelDtos.push({'channel_name':value.channel_name,'channel_id':value.channel_id});
      })
      socket.emit('channel list',channelDtos);
      console.log(channelDtos);

      socket.to(data.user_id).emit('channel list',channelDtos);
    } catch (e) {
      console.log(e);
    }
  })


  // create 
  socket.on('create channel', async (data) => {

    let new_channel_name = data.channel_name;

    try {

      let new_channel_id = md5(Date.now());

      const channel = await ChannelModel.findOne({ channel_id: new_channel_id }).exec();
      
      if (!channel) {
        const channel = new ChannelModel({ channel_name: new_channel_name, channel_id: new_channel_id, user_id: data?.user_id })
        await channel.save(channel);
        io.emit('created channel', 'done');
        console.log('create channel ${new_channel_name}');

        const channels = await ChannelModel.find({ user_id: data?.user_id }).exec();
        let channelDtos = new Array();
      

        channels.forEach((value)=>{
          channelDtos.push({'channel_name':value.channel_name,'channel_id':value.channel_id});
        })
        socket.emit('channel list',channelDtos);
        console.log(channelDtos);
      }
    } catch (e) {
      console.log(e);
    }
  })

  // 클라이언트로부터 메시지 수신
  socket.on('chat message',  (data) => {

    console.log(data.message);
    const newMessage = new MessageModel({channel_id:data.channel_id,user_id:data.user_id,message:data?.message});

    newMessage.save().then(() => {
      io.to(data.channel_id).emit('chat message', data.message);
      //socket.to(msg.channel).emit('chat message', msg);

    });
  });


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
connectDB().then(() => {
  server.listen(3000, () => {
    console.log('listening on *:3000');
  });
})


