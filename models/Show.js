import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true
    },

    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theatre",
      required: true
    },

    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Screen",
      required: true
    },

    showDate: {
      type: Date,
      required: true
    },

    startTime: {
      type: String,
      required: true
    },

    endTime: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    language: {
      type: String,
      default: "English"
    },

    format: {
      type: String,
      enum: ["2D", "3D", "IMAX", "4DX"],
      default: "2D"
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

export default mongoose.model("Show", showSchema);