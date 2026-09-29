import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Screen",
      required: true
    },

    row: {
      type: String,
      required: true,
      trim: true
    },

    seatNumber: {
      type: Number,
      required: true,
      min: 1
    },

    seatType: {
      type: String,
      enum: ["Regular", "Premium", "VIP"],
      default: "Regular"
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

seatSchema.index(
  { screen: 1, row: 1, seatNumber: 1 },
  { unique: true }
);

export default mongoose.model("Seat", seatSchema);