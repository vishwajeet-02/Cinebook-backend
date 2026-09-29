import express from "express";

import {
  createTheatre,
  getTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre
} from "../controllers/theatreController.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createTheatre);

router.get("/", getTheatres);

router.get("/:id", getTheatreById);

router.put("/:id", auth, updateTheatre);

router.delete("/:id", auth, deleteTheatre);

export default router;