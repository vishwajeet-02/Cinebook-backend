import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true
    },

    seats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
        required: true
      }
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    bookingStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending"
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending"
    },

    paymentId: {
      type: String,
      default: null
    },
    qrCode: {
  type: String,
  default: null
},

ticketId: {
  type: String,
  unique: true,
  sparse: true
},

    bookingDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);