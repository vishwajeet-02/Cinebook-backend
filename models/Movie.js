import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    genre: {
      type: [String],
      required: true
    },

    language: {
      type: String,
      required: true
    },

    duration: {
      type: Number,
      required: true
    },

    releaseDate: {
      type: Date,
      required: true
    },

    poster: {
      type: String,
      default: ""
    },

    trailer: {
      type: String,
      default: ""
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
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

export default mongoose.model("Movie", movieSchema);