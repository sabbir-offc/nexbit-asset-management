import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Movement from "@/lib/models/Movement";

export async function GET() {
  await db;
  const logs = await Movement.find().sort({ createdAt: -1 }).limit(500); // last 500 records
  return NextResponse.json(logs);
}
