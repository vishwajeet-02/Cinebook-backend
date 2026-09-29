import express from "express";
import { getSeatsForShow, bulkCreateSeats } from "../controllers/seatController.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// NEW: seats + real-time availability for a specific show
// Frontend should call this instead of a plain GET /seats
router.get("/show/:showId", getSeatsForShow);

// NEW: admin-only bulk seat layout save
router.post("/bulk", auth, adminAuth, bulkCreateSeats);

export default router;