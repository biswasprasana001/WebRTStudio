const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    username: { type: String },
    text: { type: String },
    roomId: { type: String }
});

module.exports = mongoose.model('Message', messageSchema)