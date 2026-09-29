import mongoose from "mongoose";

const screenSchema = new mongoose.Schema(
  {
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theatre",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    screenType: {
      type: String,
      enum: ["2D", "3D", "IMAX", "4DX"],
      default: "2D"
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1
    },

    rows: {
      type: Number,
      required: true,
      min: 1
    },

    seatsPerRow: {
      type: Number,
      required: true,
      min: 1
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

export default mongoose.model("Screen", screenSchema);