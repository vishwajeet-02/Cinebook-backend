import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import express from "express";
import cors from "cors";
// import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import theatreRoutes from "./routes/theatreRoutes.js";
import screenRoutes from "./routes/screenRoutes.js"
import showRoutes  from "./routes/showRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"
import recommendationRoutes from "./routes/recommendationRoutes.js"
import chatbotRoutes from "./routes/Chatbotroutes.js";

// dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "CineBook Backend Running"
  });
});

const PORT = process.env.PORT || 6060;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});