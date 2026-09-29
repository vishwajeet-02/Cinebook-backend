import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Seat from "../models/Seat.js";
import SeatLock from "../models/SeatLock.js";

// ========================================
// CREATE BOOKING  (FIXED: race-condition safe)
// ========================================

export const createBooking = async (req, res) => {
  try {
    const { show, seats } = req.body;

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        message: "Please select at least one seat"
      });
    }

    // Check show exists
    const showData = await Show.findById(show);

    if (!showData) {
      return res.status(404).json({
        message: "Show not found"
      });
    }

    // Check seats belong to this screen and are active
    const seatData = await Seat.find({
      _id: { $in: seats },
      screen: showData.screen,
      isActive: true
    });

    if (seatData.length !== seats.length) {
      return res.status(400).json({
        message: "Invalid seats selected"
      });
    }

    const totalAmount = seatData.reduce(
      (total, seat) => total + seat.price,
      0
    );

    // ---- Create the booking first (status: Pending) ----
    const booking = await Booking.create({
      user: req.user.id,
      show,
      seats,
      totalAmount
    });

    // ---- THE ACTUAL FIX ----
    // Try to lock every seat for this show. The unique index on
    // (show, seat) means MongoDB itself rejects any seat that's
    // already locked/booked -- this is what makes it safe even
    // if two users click "book" at the exact same time.
    try {
      await SeatLock.insertMany(
        seats.map((seatId) => ({
          show,
          seat: seatId,
          booking: booking._id,
          status: "pending"
        })),
        { ordered: true }
      );
    } catch (lockError) {
      // Duplicate key error = at least one seat was already taken.
      // Roll back the booking we just created so we don't leave
      // orphaned "Pending" bookings lying around.
      await Booking.findByIdAndDelete(booking._id);

      if (lockError.code === 11000) {
        return res.status(409).json({
          message:
            "One or more selected seats were just booked by someone else. Please choose different seats."
        });
      }

      throw lockError;
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "name email")
      .populate({
        path: "show",
        populate: [
          {
            path: "movie",
            select: "title poster duration genre language rating"
          },
          {
            path: "theatre",
            select: "name city address facilities"
          },
          {
            path: "screen",
            select: "name screenType totalSeats"
          }
        ]
      })
      .populate("seats");

    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking
    });
  } catch (error) {
    console.log("Create Booking Error:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// ========================================
// CONFIRM BOOKING AFTER PAYMENT  (NEW)
// ========================================
// Call this from your payment-success handler once payment is verified.
// It flips the SeatLock rows from "pending" -> "confirmed" so the TTL
// index no longer expires them, and marks the booking Confirmed/Paid.

export const confirmBookingPayment = async (req, res) => {
  try {
    const { id } = req.params; // booking id
    const { paymentId } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to modify this booking"
      });
    }

    booking.bookingStatus = "Confirmed";
    booking.paymentStatus = "Paid";
    booking.paymentId = paymentId || booking.paymentId;
    await booking.save();

    await SeatLock.updateMany(
      { booking: booking._id },
      { $set: { status: "confirmed" } }
    );

    res.json({
      message: "Payment confirmed, booking locked in",
      booking
    });
  } catch (error) {
    console.log("Confirm Booking Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// GET MY BOOKINGS
// ========================================

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id
    })
      .populate({
        path: "show",
        populate: [
          {
            path: "movie",
            select: "title poster duration genre language rating"
          },
          {
            path: "theatre",
            select: "name city address facilities"
          },
          {
            path: "screen",
            select: "name screenType totalSeats"
          }
        ]
      })
      .populate("seats")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.log("Get My Bookings Error:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// ========================================
// GET BOOKING BY ID
// ========================================

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "show",
        populate: [
          {
            path: "movie",
            select: "title poster duration genre language rating"
          },
          {
            path: "theatre",
            select: "name city address facilities"
          },
          {
            path: "screen",
            select: "name screenType totalSeats"
          }
        ]
      })
      .populate("seats");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (
      booking.user &&
      booking.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You are not allowed to access this booking"
      });
    }

    res.json(booking);
  } catch (error) {
    console.log("Get Booking Error:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// ========================================
// CANCEL BOOKING  (FIXED: also releases the seat locks)
// ========================================

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to cancel this booking"
      });
    }

    if (booking.bookingStatus === "Cancelled") {
      return res.status(400).json({
        message: "Booking is already cancelled"
      });
    }

    booking.bookingStatus = "Cancelled";
    await booking.save();

    // IMPORTANT: release the seats so someone else can book them.
    // Without this, cancelling a booking would leave the seats
    // permanently locked forever.
    await SeatLock.deleteMany({ booking: booking._id });

    res.json({
      message: "Booking cancelled successfully",
      booking
    });
  } catch (error) {
    console.log("Cancel Booking Error:", error);

    res.status(500).json({
      message: error.message
    });
  }
};
export const getAllBookings = async (req, res) => { try { const bookings = await Booking.find() 
  .populate("user", "name email") 
  .populate({ path: "show", populate: [ { path: "movie", select: "title poster duration genre language rating" },
     { path: "theatre", select: "name city address facilities" },
      { path: "screen", select: "name screenType totalSeats" } ] })
       .populate("seats") .sort({ createdAt: -1 }); 
       res.json(bookings); } catch (error) 
       { console.log("Admin Get All Bookings Error:", error); 
  res.status(500).json({ message: error.message }); } };