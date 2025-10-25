const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
    userId: String,
    ticketId: String,
    waitingTime: Number,
    productQuality: Number,
    transaction: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Review', reviewSchema);