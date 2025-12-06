import { NextResponse } from "next/server";
import { fetchIncidents } from "@/lib/traffic";

export const revalidate = 300;

export async function GET() {
  try {
    const incidents = await fetchIncidents(360);
    return NextResponse.json({ incidents });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load incidents", detail: `${error}` },
      { status: 500 },
    );
  }
}
