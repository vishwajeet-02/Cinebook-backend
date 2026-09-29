import express from "express";

import {
  createOrder,
  verifyPayment,
  getAllPayments
} from "../controllers/paymentController.js";

import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// USER - Create Razorpay Order
router.post(
  "/create-order",
  auth,
  createOrder
);

// USER - Verify Payment
router.post(
  "/verify",
  auth,
  verifyPayment
);

// ADMIN - Get All Payments
router.get(
  "/admin",
  auth,
  adminAuth,
  getAllPayments
);

export default router;