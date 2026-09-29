import mongoose from "mongoose";

/**
 * SeatLock
 * ---------
 * Ek row = "ye seat is particular show ke liye li ja chuki hai / lock hai".
 *
 * Isse pehle Seat model sirf physical seat store karta tha (row, number, price)
 * aur wahi seat saare shows ke beech shared thi -- isliye availability check
 * kabhi ho hi nahi raha tha per-show.
 *
 * Unique compound index (show + seat) MongoDB level par guarantee karta hai
 * ki ek seat, ek show ke liye, sirf EK BAAR lock/book ho sakti hai --
 * chahe do requests exact same millisecond me kyu na aayein.
 */

const seatLockSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true
    },

    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },

    // "pending" = payment abhi baaki hai, "confirmed" = payment ho chuka hai
    status: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

// Yehi line double-booking rokti hai -- DB level guarantee.
seatLockSchema.index({ show: 1, seat: 1 }, { unique: true });

// Agar payment 15 min me complete nahi hoti to lock apne aap expire ho jaye,
// taaki seat hamesha ke liye "locked" na reh jaye. Sirf "pending" locks par
// lagana hai isliye partial index use kar rahe hain.
seatLockSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 900, // 15 minutes
    partialFilterExpression: { status: "pending" }
  }
);

export default mongoose.model("SeatLock", seatLockSchema);