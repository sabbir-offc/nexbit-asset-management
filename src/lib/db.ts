import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI!;
if (!MONGO_URI) throw new Error("⚠️ Missing MONGODB_URI");

declare global {
  var _mongoose: Promise<typeof mongoose> | undefined;
}

export const db =
  global._mongoose ?? (global._mongoose = mongoose.connect(MONGO_URI));
