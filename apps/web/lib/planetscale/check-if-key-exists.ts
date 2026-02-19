import { prisma } from "@dub/prisma";
import { punyEncode } from "@dub/utils";
import {
  encodeKey,
  isCaseSensitiveDomain,
} from "../api/links/case-sensitivity";

/** Uses Prisma so it works with Railway and PlanetScale. Avoids conn (@planetscale/database) which only works with PlanetScale. */
export const checkIfKeyExists = async ({
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

  const link = await prisma.link.findFirst({
    where: { domain, key: keyToQuery },
    select: { id: true },
  });
  return Boolean(link);
};
