import QRCode from "qrcode";
import crypto from "crypto";
import Booking from "../models/Booking.js";

export const generateTicket = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("user", "name email")
      // CHANGED: was .populate("show") which only populates the Show
      // document itself -- movie/theatre/screen inside it stayed as
      // raw ObjectIds, so the ticket page couldn't show the movie
      // title, poster, theatre name, or screen name.
      .populate({
        path: "show",
        populate: [
          {
            path: "movie",
            select: "title poster duration genre language rating"
          },
          {
            path: "theatre",
            select: "name city address"
          },
          {
            path: "screen",
            select: "name screenType"
          }
        ]
      })
      .populate("seats");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to access this ticket"
      });
    }

    if (booking.paymentStatus !== "Paid") {
      return res.status(400).json({
        message: "Payment is not completed"
      });
    }

    if (booking.bookingStatus !== "Confirmed") {
      return res.status(400).json({
        message: "Booking is not confirmed"
      });
    }

    // Generate Ticket ID (only once)
    if (!booking.ticketId) {
      booking.ticketId =
        "CB-" + crypto.randomBytes(6).toString("hex").toUpperCase();
    }

    // Generate QR only if it doesn't already exist -- avoids
    // regenerating (and rewriting to the DB) on every single page
    // view of an already-confirmed ticket.
    if (!booking.qrCode) {
      const qrData = JSON.stringify({
        ticketId: booking.ticketId,
        bookingId: booking._id.toString()
      });

      booking.qrCode = await QRCode.toDataURL(qrData);
    }

    await booking.save();

    res.json({
      message: "QR ticket generated successfully",
      ticket: {
        ticketId: booking.ticketId,
        bookingId: booking._id,
        movie: booking.show?.movie,
        show: booking.show,
        seats: booking.seats,
        totalAmount: booking.totalAmount,
        qrCode: booking.qrCode
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};