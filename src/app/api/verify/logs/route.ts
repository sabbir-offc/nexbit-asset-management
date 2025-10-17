import { db } from "@/lib/db";
import VerificationLog from "@/lib/models/VerificationLog";
import { NextResponse } from "next/server";

export async function GET() {
  await db;
  const logs = await VerificationLog.find().sort({ verifiedAt: -1 }).limit(100);
  return NextResponse.json(logs);
}
