import { GoogleGenAI } from "@google/genai";
import Booking from "../models/Booking.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ========================================
// GET ALL TICKETS (admin) -- every confirmed & paid booking
// ========================================
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Booking.find({
      bookingStatus: "Confirmed",
      paymentStatus: "Paid"
    })
      .populate("user", "name email")
      .populate({
        path: "show",
        populate: [
          { path: "movie", select: "title poster" },
          { path: "theatre", select: "name city" },
          { path: "screen", select: "name" }
        ]
      })
      .populate("seats")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// GET ANALYTICS (admin) -- aggregate numbers for charts/cards
// ========================================
export const getAnalytics = async (req, res) => {
  try {
    const allBookings = await Booking.find({
      paymentStatus: "Paid"
    }).populate({
      path: "show",
      populate: { path: "movie", select: "title" }
    });

    // Revenue by month (last 12 months, Jan-Dec of current year for simplicity)
    const monthlyRevenue = Array(12).fill(0);
    const monthlyBookings = Array(12).fill(0);

    allBookings.forEach((booking) => {
      const month = new Date(booking.createdAt).getMonth();
      monthlyRevenue[month] += booking.totalAmount || 0;
      monthlyBookings[month] += 1;
    });

    // Top movies by number of bookings
    const movieCounts = {};

    allBookings.forEach((booking) => {
      const title = booking.show?.movie?.title || "Unknown";
      movieCounts[title] = (movieCounts[title] || 0) + 1;
    });

    const topMovies = Object.entries(movieCounts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalRevenue = allBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    res.json({
      totalRevenue,
      totalBookings: allBookings.length,
      averageBookingValue:
        allBookings.length > 0
          ? Math.round(totalRevenue / allBookings.length)
          : 0,
      monthlyRevenue,
      monthlyBookings,
      topMovies
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// GENERATE MOVIE DESCRIPTION (admin) -- AI-written blurb
// ========================================
// Used from the "Add/Edit Movie" form: admin fills in title, genre,
// language (and optionally a couple of keywords), clicks "Generate
// with AI", and this returns a ready-to-use description they can
// edit before saving.
export const generateMovieDescription = async (req, res) => {
  try {
    const { title, genre, language, keywords } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Movie title is required" });
    }

    const genreText = Array.isArray(genre) ? genre.join(", ") : genre || "";

    const prompt = `Write a short, exciting movie description (2-3 sentences, under 60 words) for a movie booking website, for this movie:

Title: ${title}
Genre: ${genreText || "not specified"}
Spoken language of the movie: ${language || "not specified"}
${keywords ? `Additional context: ${keywords}` : ""}

IMPORTANT: Write the description itself in English, regardless of what the movie's spoken language is. The "Spoken language" field above just tells you the movie's audio language for context -- it is not an instruction about what language to write in.

Write only the description text itself -- no title, no markdown, no quotation marks around it, no "Description:" prefix.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    const description = response.text.trim();

    res.json({ description });
  } catch (error) {
    console.log("Generate Description Error:", error);
    res.status(500).json({
      message: "Unable to generate description right now. Please try again."
    });
  }
};