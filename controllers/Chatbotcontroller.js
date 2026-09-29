import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import Movie from "../models/Movie.js";
import Booking from "../models/Booking.js";

// CHANGED: switched from "@google/generative-ai" (legacy) to the new
// official "@google/genai" SDK -- required for the new "AQ." format
// API keys to work correctly.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const chatWithAssistant = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        // invalid/expired token -- proceed as guest
      }
    }

    const movies = await Movie.find({}).select(
      "title genre language rating duration"
    );

    const movieContext = movies
      .map(
        (m) =>
          `${m.title} (${Array.isArray(m.genre) ? m.genre.join(", ") : m.genre}, ${m.language}, rating ${m.rating || "N/A"})`
      )
      .join("\n");

    let bookingContext = "";

    if (userId) {
      const bookings = await Booking.find({
        user: userId,
        bookingStatus: { $ne: "Cancelled" }
      })
        .populate({
          path: "show",
          populate: { path: "movie", select: "title" }
        })
        .sort({ createdAt: -1 })
        .limit(5);

      if (bookings.length > 0) {
        bookingContext =
          "\n\nThis user's recent bookings:\n" +
          bookings
            .map(
              (b) =>
                `- ${b.show?.movie?.title || "Unknown movie"} (status: ${b.bookingStatus}, payment: ${b.paymentStatus})`
            )
            .join("\n");
      }
    }

    const systemContext = `You are "CineBot", CineBook's friendly movie booking assistant. Help users with questions about movies, showtimes, seats, payments and how to book tickets on this site. Keep answers short and conversational (2-4 sentences unless listing something). If asked something unrelated to movies or booking, politely steer the conversation back to how you can help with CineBook. Never make up showtimes or prices you don't have data for -- tell the user to check the movie's theatre page instead.

Movies currently in our catalog:
${movieContext}${bookingContext}`;

    const chatHistory = (history || []).map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }]
    }));

    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      history: [
        { role: "user", parts: [{ text: systemContext }] },
        {
          role: "model",
          parts: [
            {
              text: "Got it! I'm CineBot, ready to help with movies and bookings on CineBook."
            }
          ]
        },
        ...chatHistory
      ]
    });

    const response = await chat.sendMessage({ message });

    res.json({ reply: response.text });
  } catch (error) {
    console.log("Chatbot Error:", error);
    res.status(500).json({
      message: "CineBot is unavailable right now. Please try again shortly."
    });
  }
};