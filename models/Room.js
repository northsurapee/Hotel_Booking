const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    maxResidents: {
      type: Number,
      default: 2,
    },
    reservedDate: [
      {
        date: {
          type: Date,
          required: true,
        },
        bookingId: {
          type: mongoose.Schema.ObjectId,
          ref: "Booking",
          required: true,
        },
      },
    ],
    createAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// // Cascade delete booking when a room is deleted
// RoomSchema.pre(
//   "deleteOne",
//   { document: true, query: false },
//   async function (next) {
//     console.log(`Booking being removed from hotel's room ${this._id}`);
//     await this.model("Booking").deleteMany({ hospital: this._id });
//     next();
//   },
// );

module.exports = mongoose.model("Room", RoomSchema);
