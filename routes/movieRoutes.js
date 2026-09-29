import express from "express";

import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie
} from "../controllers/movieController.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createMovie);

router.get("/", getMovies);

router.get("/:id", getMovieById);

router.put("/:id", auth, updateMovie);

router.delete("/:id", auth, deleteMovie);

export default router;