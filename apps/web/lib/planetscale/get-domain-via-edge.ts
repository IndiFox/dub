import { edgeDbAvailable } from "@dub/prisma/edge";
import { prisma } from "@dub/prisma";
import { conn } from "./connection";
import { EdgeDomainProps } from "./types";

export const getDomainViaEdge = async (domain: string) => {
  if (!edgeDbAvailable) {
    if (process.env.NEXT_RUNTIME === "edge") return null;
    const d = await prisma.domain.findUnique({
      where: { slug: domain },
    });
    if (!d) return null;
    return d as unknown as EdgeDomainProps;
  }
  const { rows } =
    (await conn.execute<EdgeDomainProps>(
      "SELECT * FROM Domain WHERE slug = ?",
      [domain],
    )) || {};
  return rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};
