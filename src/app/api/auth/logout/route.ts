import { NextResponse } from "next/server";
import { clearSessionCookie, deleteSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.cookies.get("openinvite_session")?.value;
  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
