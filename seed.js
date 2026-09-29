import mongoose from "mongoose";
import dotenv from "dotenv";

import Theatre from "./models/Theatre.js";
import Screen from "./models/Screen.js";
import Seat from "./models/Seat.js";
import Show from "./models/Show.js";

dotenv.config();

// ---- Movie you want to test with ----
// "Avengers: Endgame" from your Home.jsx MOVIES list
const MOVIE_ID = "6a9b097aba5be91329029df3";

const ROWS = ["A", "B", "C", "D", "E"];
const SEATS_PER_ROW = 8;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB:", process.env.MONGO_URI);

    // ---- 1. Theatre ----
    const theatre = await Theatre.create({
      name: "PVR Cinemas",
      city: "Indore",
      address: "Treasure Island Mall, MG Road",
      facilities: ["Parking", "Food Court", "Wheelchair Access"],
      isActive: true
    });
    console.log("Theatre created:", theatre._id.toString());

    // ---- 2. Screen ----
    const screen = await Screen.create({
      theatre: theatre._id,
      name: "Screen 1",
      screenType: "2D",
      totalSeats: ROWS.length * SEATS_PER_ROW,
      rows: ROWS.length,
      seatsPerRow: SEATS_PER_ROW,
      isActive: true
    });
    console.log("Screen created:", screen._id.toString());

    // ---- 3. Seats ----
    // Rows A-B = Regular, C-D = Premium, E = VIP -- just for variety
    const seatDocs = [];

    ROWS.forEach((row) => {
      let seatType = "Regular";
      let price = 150;

      if (row === "C" || row === "D") {
        seatType = "Premium";
        price = 250;
      } else if (row === "E") {
        seatType = "VIP";
        price = 400;
      }

      for (let seatNumber = 1; seatNumber <= SEATS_PER_ROW; seatNumber++) {
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

    const seats = await Seat.insertMany(seatDocs);
    console.log(`${seats.length} seats created`);

    // ---- 4. Show ----
    const show = await Show.create({
      movie: MOVIE_ID,
      theatre: theatre._id,
      screen: screen._id,
      showDate: new Date(), // today
      startTime: "18:30",
      endTime: "21:00",
      price: 200,
      language: "English",
      format: "2D",
      isActive: true
    });
    console.log("Show created:", show._id.toString());

    console.log("\n✅ Seed complete!");
    console.log("Movie ID used:", MOVIE_ID);
    console.log("Theatre ID:", theatre._id.toString());
    console.log("Screen ID:", screen._id.toString());
    console.log("Show ID:", show._id.toString());
    console.log(
      `\nTest flow: /movie/${MOVIE_ID}/theatres  ->  should now show a showtime button`
    );

    process.exit(0);
  } catch (error) {
    console.error("Seed script error:", error);
    process.exit(1);
  }
};

run();