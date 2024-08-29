import { NextResponse } from "next/server";
import { downloadFile } from "@/lib/graph";
import { getServerTokens } from "@/lib/getServerTokens";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "No path provided" }, { status: 400 });
  }

  try {
    const { accessToken } = await getServerTokens();
    const file = await downloadFile(accessToken, path);
    return new NextResponse(file, {
      headers: {
        "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}
