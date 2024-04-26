const mongoose = require("mongoose");
const Room = require("./Room");

const BookingSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  residents: {
    type: Number,
    required: true,
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  hotelId: {
    type: mongoose.Schema.ObjectId,
    ref: "Hotel",
    required: true,
  },
  rooms: [
    {
      roomId: {
        type: mongoose.Schema.ObjectId,
        ref: "Room",
        required: true,
      },
    },
  ],
  isEmailSent: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Booking", BookingSchema);