import {
  decodeKeyIfCaseSensitive,
  encodeKey,
  isCaseSensitiveDomain,
} from "@/lib/api/links/case-sensitivity";
import { prisma } from "@dub/prisma";
import { punyEncode } from "@dub/utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * Internal API: resolve link by domain+key for Edge middleware when DB is Railway.
 * Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domain = req.nextUrl.searchParams.get("domain");
  const key = req.nextUrl.searchParams.get("key");
  if (!domain || !key) {
    return NextResponse.json({ error: "Missing domain or key" }, { status: 400 });
  }

  const keyToQuery = isCaseSensitiveDomain(domain)
    ? encodeKey(key)
    : punyEncode(decodeURIComponent(key));

  const link = await prisma.link.findFirst({
    where: { domain, key: keyToQuery },
  });
  if (!link) {
    return NextResponse.json(null, { status: 404 });
  }

  const decodedKey = decodeKeyIfCaseSensitive({ domain, key: link.key });

  return NextResponse.json({
    ...link,
    key: decodedKey,
    proxy: link.proxy ? 1 : 0,
    rewrite: link.rewrite ? 1 : 0,
    publicStats: 0,
    verified: 0,
    archived: 0,
  });
}
