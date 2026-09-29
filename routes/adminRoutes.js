import express from "express";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  getAllTickets,
  getAnalytics,
  generateMovieDescription
} from "../controllers/Admincontroller.js";
import {
  getAllUsers,
  toggleUserStatus
} from "../controllers/adminUserController.js";
import {
  getFraudAlerts,
  generateFraudSummary
} from "../controllers/Fraudcontroller.js";

const router = express.Router();

// All routes here require a logged-in admin
router.use(auth, adminAuth);

router.get("/tickets", getAllTickets);
router.get("/analytics", getAnalytics);
router.get("/users", getAllUsers);
router.put("/users/:id/toggle-status", toggleUserStatus);
router.post("/generate-description", generateMovieDescription);
router.get("/fraud-alerts", getFraudAlerts);
router.post("/fraud-summary", generateFraudSummary);

export default router;