import express from "express";

import {
  register,
  login,
  profile
} from "../controllers/authController.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/profile", auth, profile);

export default router;