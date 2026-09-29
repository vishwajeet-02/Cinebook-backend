import express from "express";
import { chatWithAssistant } from "../controllers/Chatbotcontroller.js";

const router = express.Router();

// No auth middleware -- works for guests. If a valid token is sent,
// the controller decodes it itself to personalize the reply.
router.post("/", chatWithAssistant);

export default router;