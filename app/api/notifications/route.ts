import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    include: {
      invitation: {
        include: { inviter: { select: { id: true, name: true } } },
      },
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}
