import { NextResponse } from "next/server";
import { loadAnalysisSnapshot } from "@/lib/traffic";

export const revalidate = 600;

export async function GET() {
  try {
    const snapshot = await loadAnalysisSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: "Analysis snapshot missing", detail: `${error}` },
      { status: 500 },
    );
  }
}
