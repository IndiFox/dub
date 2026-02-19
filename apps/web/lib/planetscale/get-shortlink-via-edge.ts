import { prisma } from "@dub/prisma";
import { EdgeLinkProps } from "./types";

/** Used only from Node (api/qr). Uses Prisma for Railway/PlanetScale. */
export const getShortLinkViaEdge = async (shortLink: string) => {
  const link = await prisma.link.findFirst({
    where: { shortLink },
  });
  return link ? (link as unknown as EdgeLinkProps) : null;
};
