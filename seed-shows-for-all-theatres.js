import mongoose from "mongoose";
import dotenv from "dotenv";

import Theatre from "./models/Theatre.js";
import Screen from "./models/Screen.js";
import Show from "./models/Show.js";
import Seat from "./models/Seat.js";

dotenv.config();

// All 10 movies from the Home page catalog
const MOVIES = [
  { id: "6a9b097aba5be91329029df3", title: "Avengers: Endgame", time: "09:00", price: 240 },
  { id: "6a9b097aba5be91329029df4", title: "Interstellar", time: "10:30", price: 220 },
  { id: "6a9b097aba5be91329029df5", title: "Inception", time: "12:00", price: 220 },
  { id: "6a9b097aba5be91329029df6", title: "The Dark Knight", time: "13:30", price: 230 },
  { id: "6a9b097aba5be91329029df7", title: "Jawan", time: "15:00", price: 200 },
  { id: "6a9b097aba5be91329029df8", title: "Pathaan", time: "16:30", price: 200 },
  { id: "6a9b097aba5be91329029df9", title: "Animal", time: "18:00", price: 210 },
  { id: "6a9b097aba5be91329029dfa", title: "Dangal", time: "19:30", price: 190 },
  { id: "6a9b097aba5be91329029dfb", title: "KGF: Chapter 2", time: "21:00", price: 210 },
  { id: "6a9b097aba5be91329029dfc", title: "3 Idiots", time: "22:30", price: 180 }
];

const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const ensureSeats = async (screen) => {
  const existingCount = await Seat.countDocuments({ screen: screen._id });
  if (existingCount > 0) return;

  const numRows = screen.rows || 5;
  const perRow = screen.seatsPerRow || 8;
  const rows = ROW_LETTERS.slice(0, numRows);
  const seatDocs = [];

  rows.forEach((row, index) => {
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
      seatDocs.push({ screen: screen._id, row, seatNumber, seatType, price, isActive: true });
    }
  });

  await Seat.insertMany(seatDocs);
  console.log(`   → seeded ${seatDocs.length} seats for this screen`);
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB:", process.env.MONGO_URI);

    const theatres = await Theatre.find({ isActive: true });

    if (theatres.length === 0) {
      console.log("No theatres found.");
      process.exit(1);
    }

    let showsCreated = 0;
    let showsSkipped = 0;

    for (const theatre of theatres) {
      const screens = await Screen.find({ theatre: theatre._id, isActive: true });

      if (screens.length === 0) {
        console.log(`⚠ "${theatre.name}" (${theatre._id}) has no screens -- skipping`);
        continue;
      }

      for (const screen of screens) {
        console.log(`\n${theatre.name} → ${screen.name} (${screen._id})`);

        // Make sure this screen actually has seats before giving it shows
        await ensureSeats(screen);

        for (const movie of MOVIES) {
          const existing = await Show.findOne({
            movie: movie.id,
            theatre: theatre._id,
            screen: screen._id,
            startTime: movie.time
          });

          if (existing) {
            showsSkipped++;
            continue;
          }

          const [hour, minute] = movie.time.split(":").map(Number);
          const endHour = (hour + 2) % 24;
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

          showsCreated++;
        }

        console.log(`   → shows ensured for all ${MOVIES.length} movies`);
      }
    }

    console.log(
      `\n✅ Done. ${showsCreated} new shows created, ${showsSkipped} already existed.`
    );
    console.log("Every theatre should now show booking options for every movie.");

    process.exit(0);
  } catch (error) {
    console.error("Seed script error:", error);
    process.exit(1);
  }
};

run();