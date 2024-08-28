import { NextResponse } from "next/server";
import { getDriveContents } from "@/lib/graph";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "";

  try {
    const contents = await getDriveContents(session.accessToken, path);

    const files = contents.map((item: any) => ({
      id: item.id,
      name: item.name,
      path: path ? `${path}/${item.name}` : item.name,
      isFolder: !!item.folder,
      size: item.size || 0,
      mimeType: item.file?.mimeType || (item.folder ? "folder" : "unknown"),
      lastModifiedDateTime: item.lastModifiedDateTime,
    }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error in files API:", error);
    return NextResponse.json(
      { error: "Failed to retrieve files" },
      { status: 500 },
    );
  }
}
