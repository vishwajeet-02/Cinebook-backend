import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";
import SeatLock from "../models/SeatLock.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// CREATE RAZORPAY ORDER
export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to pay for this booking"
      });
    }

    if (booking.bookingStatus === "Cancelled") {
      return res.status(400).json({
        message: "Booking is cancelled"
      });
    }

    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({
        message: "Booking is already paid"
      });
    }

    const options = {
      amount: booking.totalAmount * 100,
      currency: "INR",
      receipt: `booking_${booking._id}`
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      message: "Razorpay order created successfully",
      order
    });
  } catch (error) {
    console.log("Create Order Error:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Check booking belongs to logged-in user
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to verify this booking"
      });
    }

    // Prevent duplicate verification
    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({
        message: "Booking is already paid"
      });
    }

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Invalid payment signature"
      });
    }

    booking.paymentStatus = "Paid";
    booking.bookingStatus = "Confirmed";
    booking.paymentId = razorpay_payment_id;

    await booking.save();

    await SeatLock.updateMany(
      { booking: booking._id },
      {
        $set: {
          status: "confirmed"
        }
      }
    );

    res.json({
      message: "Payment verified successfully",
      booking
    });

  } catch (error) {
    console.log("Verify Payment Error:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// GET ALL PAYMENTS - ADMIN
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Booking.find()
      .populate("user", "name email")
      .populate({
        path: "show",
        populate: [
          {
            path: "movie",
            select: "title poster"
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
      .sort({ createdAt: -1 });

    res.json({
      payments
    });

  } catch (error) {
    console.log("Admin Get Payments Error:", error);

    res.status(500).json({
      message: error.message
    });
  }
};