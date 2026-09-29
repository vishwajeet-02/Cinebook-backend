import { GoogleGenAI } from "@google/genai";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

// CHANGED: switched from the legacy "@google/generative-ai" package to
// the new official "@google/genai" SDK. The legacy package doesn't
// properly support the new "AQ." format API keys that Google AI Studio
// now issues -- the new SDK handles that internally.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const parseJsonResponse = (text) => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini's free tier occasionally returns a transient 503 ("high
// demand") that usually clears up within a second or two. One quick
// retry avoids falling back to generic "Popular picks" unnecessarily.
const generateWithRetry = async (prompt, retries = 1) => {
  try {
    return await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
  } catch (error) {
    if (retries > 0 && error?.status === 503) {
      await sleep(1000);
      return generateWithRetry(prompt, retries - 1);
    }
    throw error;
  }
};

export const smartSearch = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const allMovies = await Movie.find({});

    if (allMovies.length === 0) {
      return res.json({ movies: [], explanation: "" });
    }

    const catalogList = allMovies
      .map(
        (m) =>
          `${m._id}: ${m.title} (${Array.isArray(m.genre) ? m.genre.join(", ") : m.genre}, ${m.language}, rating ${m.rating || "N/A"}) -- ${m.description || "no description"}`
      )
      .join("\n");

    const prompt = `A user searched for movies using this natural language query: "${query}"

Here is the full movie catalog (format is id: title (genre, language, rating) -- description):
${catalogList}

Find the movies from this catalog that best match what the user is looking for. Consider genre, mood, themes, and any other clues in their query.

Respond ONLY with valid JSON, no markdown, in this exact shape:
{"movieIds": ["<id1>", "<id2>"], "explanation": "<one short sentence on why these match>"}

If nothing matches well, return an empty movieIds array.`;

    const response = await generateWithRetry(prompt);
    const parsed = parseJsonResponse(response.text);

    const matchedMovies = allMovies.filter((movie) =>
      parsed.movieIds.includes(movie._id.toString())
    );

    res.json({
      movies: matchedMovies,
      explanation: parsed.explanation || ""
    });
  } catch (error) {
    console.log("Smart Search Error:", error);
    res.status(500).json({
      message: "Search is unavailable right now. Try a regular keyword search instead."
    });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const pastBookings = await Booking.find({
      user: req.user.id,
      bookingStatus: { $ne: "Cancelled" }
    }).populate({
      path: "show",
      populate: { path: "movie", select: "title genre language rating" }
    });

    const watchedMovies = pastBookings
      .map((booking) => booking.show?.movie)
      .filter(Boolean);

    const allMovies = await Movie.find({});

    if (allMovies.length === 0) {
      return res.json({ recommendations: [] });
    }

    if (watchedMovies.length === 0) {
      const fallback = [...allMovies]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      return res.json({
        recommendations: fallback,
        reason: "Popular picks to get you started"
      });
    }

    const watchedList = watchedMovies
      .map(
        (m) =>
          `${m.title} (${Array.isArray(m.genre) ? m.genre.join(", ") : m.genre})`
      )
      .join(", ");

    const catalogList = allMovies
      .map(
        (m) =>
          `${m._id}: ${m.title} (${Array.isArray(m.genre) ? m.genre.join(", ") : m.genre}, ${m.language})`
      )
      .join("\n");

    const prompt = `A user has watched/booked these movies: ${watchedList}.

Here is the full catalog of movies currently available (format is id: title (genre, language)):
${catalogList}

Recommend up to 5 movies from this catalog (excluding ones they've already watched) that this user would most likely enjoy next, based on genre and language patterns.

Respond ONLY with valid JSON, no markdown formatting, no explanation outside the JSON, in this exact shape:
{"movieIds": ["<id1>", "<id2>"], "reason": "<one short sentence explaining the pattern you noticed>"}`;

    const response = await generateWithRetry(prompt);

    const parsed = parseJsonResponse(response.text);

    const watchedIds = new Set(watchedMovies.map((m) => m._id.toString()));

    const recommendedMovies = allMovies.filter(
      (movie) =>
        parsed.movieIds.includes(movie._id.toString()) &&
        !watchedIds.has(movie._id.toString())
    );

    res.json({
      recommendations: recommendedMovies,
      reason: parsed.reason
    });
  } catch (error) {
    console.log("Recommendation Error:", error);

    try {
      const fallback = await Movie.find({}).sort({ rating: -1 }).limit(5);
      return res.json({
        recommendations: fallback,
        reason: "Popular picks"
      });
    } catch {
      return res.status(500).json({ message: error.message });
    }
  }
};