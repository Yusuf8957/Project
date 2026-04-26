const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  paymentId: { type: String, default: null },     
  orderId: { type: String, default: null },         
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "cancelled"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);