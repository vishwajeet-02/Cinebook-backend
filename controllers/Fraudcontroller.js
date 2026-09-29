import { GoogleGenAI } from "@google/genai";
import Booking from "../models/Booking.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Thresholds -- tune these as the platform grows
const RAPID_BOOKING_WINDOW_MIN = 10;
const RAPID_BOOKING_COUNT = 3;
const STALE_PENDING_MIN = 20;
const STALE_PENDING_COUNT = 3;
const MIN_CANCELLATIONS_TO_FLAG = 3;
const CANCELLATION_RATE_THRESHOLD = 0.5;

// ========================================
// GET FRAUD ALERTS (admin)
// ========================================
// Pure rule-based detection over the last 30 days of bookings --
// deliberately NOT an AI call per user, since that would burn through
// the Gemini free-tier quota fast on every dashboard load. AI is only
// used (optionally, on demand) to write a one-paragraph plain-English
// summary of what was found -- see generateFraudSummary below.
export const getFraudAlerts = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // Group bookings by user
    const byUser = new Map();

    bookings.forEach((booking) => {
      if (!booking.user) return;
      const userId = booking.user._id.toString();

      if (!byUser.has(userId)) {
        byUser.set(userId, {
          user: booking.user,
          bookings: []
        });
      }

      byUser.get(userId).bookings.push(booking);
    });

    const alerts = [];

    for (const { user, bookings: userBookings } of byUser.values()) {
      const flags = [];

      // 1. Rapid booking burst -- N+ bookings within a short window
      const sortedByTime = [...userBookings].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      for (let i = 0; i <= sortedByTime.length - RAPID_BOOKING_COUNT; i++) {
        const windowStart = new Date(sortedByTime[i].createdAt);
        const windowEnd = new Date(
          sortedByTime[i + RAPID_BOOKING_COUNT - 1].createdAt
        );
        const diffMin = (windowEnd - windowStart) / 60000;

        if (diffMin <= RAPID_BOOKING_WINDOW_MIN) {
          flags.push({
            type: "rapid_bookings",
            label: "Rapid booking burst",
            detail: `${RAPID_BOOKING_COUNT} bookings within ${Math.round(diffMin)} minutes`
          });
          break;
        }
      }

      // 2. Multiple stale, unpaid ("abandoned") bookings
      const now = Date.now();
      const stalePending = userBookings.filter((b) => {
        const ageMin = (now - new Date(b.createdAt)) / 60000;
        return (
          b.paymentStatus === "Pending" &&
          b.bookingStatus !== "Cancelled" &&
          ageMin >= STALE_PENDING_MIN
        );
      });

      if (stalePending.length >= STALE_PENDING_COUNT) {
        flags.push({
          type: "stale_pending",
          label: "Multiple abandoned payments",
          detail: `${stalePending.length} unpaid bookings older than ${STALE_PENDING_MIN} min`
        });
      }

      // 3. High cancellation rate
      const cancelled = userBookings.filter(
        (b) => b.bookingStatus === "Cancelled"
      ).length;

      const cancellationRate = cancelled / userBookings.length;

      if (
        userBookings.length >= MIN_CANCELLATIONS_TO_FLAG &&
        cancellationRate >= CANCELLATION_RATE_THRESHOLD
      ) {
        flags.push({
          type: "high_cancellation",
          label: "High cancellation rate",
          detail: `${cancelled} of ${userBookings.length} bookings cancelled (${Math.round(cancellationRate * 100)}%)`
        });
      }

      if (flags.length > 0) {
        alerts.push({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email
          },
          flags,
          riskScore: flags.length, // simple: more flags = higher risk
          totalBookings: userBookings.length,
          lastActivity: sortedByTime[sortedByTime.length - 1].createdAt
        });
      }
    }

    // Highest risk first
    alerts.sort((a, b) => b.riskScore - a.riskScore);

    res.json({ alerts, scannedBookings: bookings.length });
  } catch (error) {
    console.log("Fraud Detection Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// GENERATE AI RISK SUMMARY (admin) -- on demand, one call
// ========================================
export const generateFraudSummary = async (req, res) => {
  try {
    const { alerts } = req.body;

    if (!alerts || alerts.length === 0) {
      return res.json({
        summary: "No suspicious activity detected in the last 30 days."
      });
    }

    const alertsText = alerts
      .map(
        (a) =>
          `${a.user.name} (${a.user.email}): ${a.flags.map((f) => f.label).join(", ")} -- risk score ${a.riskScore}`
      )
      .join("\n");

    const prompt = `You are a fraud analyst for a movie ticket booking platform. Here are flagged accounts from the last 30 days:

${alertsText}

Write a short (3-5 sentence) plain-English summary for the admin: what the overall pattern looks like, which accounts need the most urgent attention, and one practical next step. Do not use markdown formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    res.json({ summary: response.text.trim() });
  } catch (error) {
    console.log("Fraud Summary Error:", error);
    res.status(500).json({
      message: "Unable to generate AI summary right now. The alert list above is still accurate."
    });
  }
};