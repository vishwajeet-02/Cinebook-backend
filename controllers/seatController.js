import Seat from "../models/Seat.js";
import Show from "../models/Show.js";
import SeatLock from "../models/SeatLock.js";

// ========================================
// GET SEATS FOR A SHOW  (NEW - per-show availability)
// ========================================
// Old behaviour: GET /seats returned every seat in the DB with no idea
// which ones were already booked for the show the user was looking at.
// This is the endpoint the frontend should call instead:
//   GET /seats/show/:showId

export const getSeatsForShow = async (req, res) => {
  try {
    const { showId } = req.params;

    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    // All physical seats on this screen
    const seats = await Seat.find({
      screen: show.screen,
      isActive: true
    }).sort({ row: 1, seatNumber: 1 });

    // Every seat currently locked (pending payment) or confirmed
    // for THIS specific show
    const locks = await SeatLock.find({ show: showId }).select("seat status");

    const lockedSeatIds = new Set(locks.map((lock) => lock.seat.toString()));

    // Attach isBooked so the frontend can disable/gray out the seat
    const seatsWithAvailability = seats.map((seat) => ({
      ...seat.toObject(),
      isBooked: lockedSeatIds.has(seat._id.toString())
    }));

    res.json(seatsWithAvailability);
  } catch (error) {
    console.log("Get Seats For Show Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// BULK CREATE SEATS (admin)  (NEW)
// ========================================
// Used by the Admin "Seat Management" layout generator. It replaces
// any existing seats for this screen with the new layout -- so
// re-generating and re-saving a layout for the same screen doesn't
// create duplicates.
export const bulkCreateSeats = async (req, res) => {
  try {
    const { screen, seats } = req.body;

    if (!screen || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        message: "screen and a non-empty seats array are required"
      });
    }

    // Remove any seats already configured for this screen, then
    // insert the freshly generated layout.
    await Seat.deleteMany({ screen });

    const seatDocs = seats.map((seat) => ({
      screen,
      row: seat.row,
      seatNumber: seat.seatNumber,
      seatType: seat.seatType || "Regular",
      price: seat.price || 150,
      isActive: true
    }));

    const created = await Seat.insertMany(seatDocs);

    res.status(201).json({
      message: `${created.length} seats saved successfully`,
      seats: created
    });
  } catch (error) {
    console.log("Bulk Create Seats Error:", error);
    res.status(500).json({ message: error.message });
  }
};