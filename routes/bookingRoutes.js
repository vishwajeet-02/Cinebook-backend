import express from "express";

import {
  createBooking,
  confirmBookingPayment,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings
} from "../controllers/bookingController.js";

import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// ========================================
// CREATE BOOKING
// ========================================

router.post("/", auth, createBooking);

// ========================================
// CONFIRM BOOKING AFTER PAYMENT
// ========================================

router.put("/confirm/:id", auth, confirmBookingPayment);

// ========================================
// MY BOOKINGS
// Normal logged-in user
// ========================================

router.get("/my", auth, getMyBookings);

// ========================================
// ADMIN - GET ALL BOOKINGS
// ========================================

router.get("/admin", auth, adminAuth, getAllBookings);

// ========================================
// GET BOOKING BY ID
// ========================================

router.get("/:id", auth, getBookingById);

// ========================================
// CANCEL BOOKING
// ========================================

router.put("/cancel/:id", auth, cancelBooking);

export default router;