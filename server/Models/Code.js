const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const codeSchema = new Schema({
    roomId: { type: String },
    html: { type: String },
    css: { type: String },
    js: { type: String }
});

module.exports = mongoose.model('Code', codeSchema)