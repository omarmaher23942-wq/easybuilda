import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.API_URL ?? "http://153.92.221.161:8001";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const url = `${BACKEND}/${pathStr}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: res.status });
    } catch {
      return new NextResponse(text, { status: res.status });
    }
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
export const PUT = handler;
export const PATCH = handler;