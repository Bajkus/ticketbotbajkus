const mongoose2 = require('mongoose');


const ReviewSchema = new mongoose2.Schema({
userId: { type: String, required: true },
userTag: { type: String },
waitTime: { type: Number, required: true },
quality: { type: Number, required: true },
transaction: { type: Number, required: true },
comment: { type: String },
ticketId: { type: String },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose2.model('Review', ReviewSchema);
