const { default: mongoose } = require("mongoose");


const channelSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    id: { type: String, required: true ,index:true},
    owner_id: { type: String, required: true, index:true },
    timestamp: { type: Date, default: Date.now, index: true }
  });
  
const ChannelModel = mongoose.model('Channel', channelSchema);

const channelMemberSchema = new mongoose.Schema({
    channel_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true ,index:true},
    timestamp: { type: Date, default: Date.now, index: true }
})

const ChannelMemberModel = mongoose.model('ChannelMember',channelMemberSchema);

const messageSchema = new mongoose.Schema({
    channel_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true }
  });
  
const MessageModel = mongoose.model('Message', messageSchema);
  
module.exports = {
    ChannelModel,
    ChannelMemberModel,
    MessageModel
}