import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const draft = await draftMode();
  draft.disable();

  // Redirect back to the page the user was previewing, or home
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/";
  redirect(returnTo);
}
