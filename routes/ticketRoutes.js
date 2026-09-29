import express from "express";

import {
  generateTicket
} from "../controllers/ticketController.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/:bookingId",
  auth,
  generateTicket
);

export default router;