import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";
import { readMedia, type MediaKind } from "@/lib/storage/index";

const KINDS: ReadonlySet<string> = new Set<MediaKind>(["generated", "reference-0", "reference-1"]);

function isMediaKind(kind: string): kind is MediaKind {
  return KINDS.has(kind);
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string; kind: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, kind } = await ctx.params;
  if (!isMediaKind(kind)) return new NextResponse(null, { status: 404 });

  const generation = await prisma.generation.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!generation || generation.userId !== user.id) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await readMedia(id, kind);
  if (!file) return new NextResponse(null, { status: 404 });

  const headers = new Headers({
    "Content-Type": file.contentType,
    "Cache-Control": "private, max-age=3600",
  });
  if (new URL(request.url).searchParams.get("download") === "1") {
    const ext = file.contentType.split("/")[1] ?? "png";
    headers.set("Content-Disposition", `attachment; filename="${id}-${kind}.${ext}"`);
  }
  return new NextResponse(file.data as unknown as BodyInit, { status: 200, headers });
}
