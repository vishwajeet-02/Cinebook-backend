import mongoose from "mongoose";
import dotenv from "dotenv";

import Screen from "./models/Screen.js";
import Seat from "./models/Seat.js";

dotenv.config();

const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB:", process.env.MONGO_URI);

    const screens = await Screen.find({ isActive: true });

    if (screens.length === 0) {
      console.log("No screens found. Create a theatre + screen first.");
      process.exit(1);
    }

    let totalCreated = 0;

    for (const screen of screens) {
      const existingCount = await Seat.countDocuments({ screen: screen._id });

      if (existingCount > 0) {
        console.log(
          `Skipping "${screen.name}" (${screen._id}) -- already has ${existingCount} seats`
        );
        continue;
      }

      // Use the screen's own configured dimensions, falling back to
      // a sensible default (5 rows x 8 seats) if they weren't set.
      const numRows = screen.rows || 5;
      const perRow = screen.seatsPerRow || 8;

      const rows = ROW_LETTERS.slice(0, numRows);
      const seatDocs = [];

      rows.forEach((row, index) => {
        // Simple tiering: last row = VIP, second-last two rows = Premium,
        // everything else = Regular. Works for any row count >= 1.
        let seatType = "Regular";
        let price = 150;

        const rowsFromEnd = numRows - index;

        if (rowsFromEnd === 1) {
          seatType = "VIP";
          price = 400;
        } else if (rowsFromEnd <= 3) {
          seatType = "Premium";
          price = 250;
        }

        for (let seatNumber = 1; seatNumber <= perRow; seatNumber++) {
          seatDocs.push({
            screen: screen._id,
            row,
            seatNumber,
            seatType,
            price,
            isActive: true
          });
        }
      });

      const created = await Seat.insertMany(seatDocs);
      totalCreated += created.length;

      console.log(
        `✅ Created ${created.length} seats for "${screen.name}" (${screen._id}) -- ${numRows} rows x ${perRow} seats`
      );
    }

    console.log(`\nDone. ${totalCreated} seats created in total.`);
    process.exit(0);
  } catch (error) {
    console.error("Seed script error:", error);
    process.exit(1);
  }
};

run();