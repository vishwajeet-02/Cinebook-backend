import express from "express";
import { getRecommendations, smartSearch } from "../controllers/recommendationController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Personalized movie recommendations for the logged-in user
router.get("/", auth, getRecommendations);

// Natural language smart search -- public, no login needed
router.post("/smart-search", smartSearch);

export default router;