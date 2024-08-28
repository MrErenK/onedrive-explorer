import { NextResponse } from "next/server";
import { downloadFile } from "@/lib/graph";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "No path provided" }, { status: 400 });
  }

  try {
    const file = await downloadFile(session.accessToken, path);
    return new NextResponse(file, {
      headers: {
        "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}
