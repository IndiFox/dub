import { prisma } from "@dub/prisma";

/** Uses Prisma (DATABASE_URL) so it works with both Railway and PlanetScale. Avoids conn (@planetscale/database) which only works with PlanetScale and throws "fetch failed" on Railway. */
export const checkIfUserExists = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return Boolean(user);
};
