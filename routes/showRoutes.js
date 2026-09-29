import express from "express";

import {
  createShow,
  getShows,
  getShowById,
  updateShow,
  deleteShow
} from "../controllers/showController.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createShow);

router.get("/", getShows);

router.get("/:id", getShowById);

router.put("/:id", auth, updateShow);

router.delete("/:id", auth, deleteShow);

export default router;