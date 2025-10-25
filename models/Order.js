const mongoose = require('mongoose');


const OrderSchema = new mongoose.Schema({
userId: { type: String, required: true },
userTag: { type: String },
type: { type: String, enum: ['zamowienie', 'reklamacja'], required: true },
product: { type: String },
quantity: { type: String },
payment: { type: String },
description: { type: String },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Order', OrderSchema);
