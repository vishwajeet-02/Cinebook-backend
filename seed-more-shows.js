import mongoose from "mongoose";
import dotenv from "dotenv";

import Theatre from "./models/Theatre.js";
import Screen from "./models/Screen.js";
import Show from "./models/Show.js";

dotenv.config();

// All movies from the Home page catalog, EXCLUDING Avengers: Endgame
// (which already has a show from the first seed.js run).
// Each has its own showtime slot the same day so they don't clash.
const MOVIES = [
  { id: "6a9b097aba5be91329029df4", title: "Interstellar", time: "10:00", price: 220 },
  { id: "6a9b097aba5be91329029df5", title: "Inception", time: "13:00", price: 220 },
  { id: "6a9b097aba5be91329029df6", title: "The Dark Knight", time: "16:00", price: 230 },
  { id: "6a9b097aba5be91329029df7", title: "Jawan", time: "19:00", price: 200 },
  { id: "6a9b097aba5be91329029df8", title: "Pathaan", time: "22:00", price: 200 },
  { id: "6a9b097aba5be91329029df9", title: "Animal", time: "11:30", price: 210 },
  { id: "6a9b097aba5be91329029dfa", title: "Dangal", time: "14:30", price: 190 },
  { id: "6a9b097aba5be91329029dfb", title: "KGF: Chapter 2", time: "17:30", price: 210 },
  { id: "6a9b097aba5be91329029dfc", title: "3 Idiots", time: "20:30", price: 180 }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB:", process.env.MONGO_URI);

    // Reuse the existing theatre + screen created by seed.js.
    // If none exists yet, tell the user to run seed.js first.
    const theatre = await Theatre.findOne({ isActive: true });
    const screen = await Screen.findOne({ isActive: true });

    if (!theatre || !screen) {
      console.log(
        "\n❌ No existing Theatre/Screen found. Run seed.js first to create the theatre, screen, and seats, then run this script.\n"
      );
      process.exit(1);
    }

    console.log("Using Theatre:", theatre.name, theatre._id.toString());
    console.log("Using Screen:", screen.name, screen._id.toString());

    let created = 0;
    let skipped = 0;

    for (const movie of MOVIES) {
      // Avoid creating duplicate shows if this script is run twice
      const existing = await Show.findOne({
        movie: movie.id,
        theatre: theatre._id,
        screen: screen._id,
        startTime: movie.time
      });

      if (existing) {
        console.log(`Skipping ${movie.title} -- show already exists`);
        skipped++;
        continue;
      }

      const [hour, minute] = movie.time.split(":").map(Number);
      const endHour = (hour + 2) % 24; // rough 2hr runtime for the slot
      const endTime = `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      await Show.create({
        movie: movie.id,
        theatre: theatre._id,
        screen: screen._id,
        showDate: new Date(),
        startTime: movie.time,
        endTime,
        price: movie.price,
        language: "English",
        format: "2D",
        isActive: true
      });

      console.log(`✅ Show created for ${movie.title} at ${movie.time}`);
      created++;
    }

    console.log(`\nDone. ${created} shows created, ${skipped} already existed.`);
    console.log("Every movie on the Home page should now have a bookable showtime.");

    process.exit(0);
  } catch (error) {
    console.error("Seed script error:", error);
    process.exit(1);
  }
};

run();