import { edgeDbAvailable } from "@dub/prisma/edge";
import { prisma } from "@dub/prisma";
import { punyEncode } from "@dub/utils";
import {
  decodeKeyIfCaseSensitive,
  encodeKey,
  isCaseSensitiveDomain,
} from "../api/links/case-sensitivity";
import { conn } from "./connection";
import { EdgeLinkProps } from "./types";

export const getLinkViaEdge = async ({
  domain,
  key,
}: {
  domain: string;
  key: string;
}) => {
  const isCaseSensitive = isCaseSensitiveDomain(domain);
  const keyToQuery = isCaseSensitive
    ? encodeKey(key)
    : punyEncode(decodeURIComponent(key));

  if (edgeDbAvailable) {
    const { rows } =
      (await conn.execute("SELECT * FROM Link WHERE domain = ? AND `key` = ?", [
        domain,
        keyToQuery,
      ])) || {};
    const link =
      rows && Array.isArray(rows) && rows.length > 0
        ? (rows[0] as EdgeLinkProps)
        : null;
    return link
      ? { ...link, key: decodeKeyIfCaseSensitive({ domain, key }) }
      : null;
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const base =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://app.revroute.ru");
    const url = `${base}/api/internal/link?domain=${encodeURIComponent(domain)}&key=${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
        },
      });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  const link = await prisma.link.findFirst({
    where: { domain, key: keyToQuery },
  });
  if (!link) return null;
  return {
    ...link,
    key: decodeKeyIfCaseSensitive({ domain, key: link.key }),
    proxy: link.proxy ? 1 : 0,
    rewrite: link.rewrite ? 1 : 0,
  } as EdgeLinkProps;
};
