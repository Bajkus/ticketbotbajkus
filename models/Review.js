// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: String,
    userTag: String,
    waitTime: Number,
    quality: Number,
    transaction: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', reviewSchema);
