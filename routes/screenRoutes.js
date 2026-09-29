import express from "express";

import {
  createScreen,
  getScreens,
  getScreenById,
  updateScreen,
  deleteScreen
} from "../controllers/screenController.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createScreen);

router.get("/", getScreens);

router.get("/:id", getScreenById);

router.put("/:id", auth, updateScreen);

router.delete("/:id", auth, deleteScreen);

export default router;