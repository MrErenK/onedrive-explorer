import { NextResponse } from "next/server";
import { getDriveContents, getDriveItem, downloadFile } from "@/lib/graph";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "";
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "download":
        const fileContent = await downloadFile(session.accessToken, path);
        return new NextResponse(fileContent, {
          headers: {
            "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
          },
        });
      case "item":
        const item = await getDriveItem(session.accessToken, path);
        return NextResponse.json(item);
      default:
        const contents = await getDriveContents(session.accessToken, path);
        return NextResponse.json({ value: contents });
    }
  } catch (error) {
    console.error("Error in OneDrive API:", error);
    return NextResponse.json(
      { error: "Failed to perform OneDrive operation" },
      { status: 500 },
    );
  }
}
