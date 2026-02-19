import { prisma } from "@dub/prisma";
import { punyEncode } from "@dub/utils";
import {
  decodeKeyIfCaseSensitive,
  encodeKey,
  isCaseSensitiveDomain,
} from "../api/links/case-sensitivity";
import { EdgeLinkProps } from "./types";

interface QueryResult extends EdgeLinkProps {
  partner?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  discount?: {
    id: string;
    amount: number;
    type: "percentage" | "flat";
    maxDuration: number | null;
  } | null;
}

/** Used only from Node (api/track/click). Uses Prisma for Railway/PlanetScale. */
export const getLinkWithPartner = async ({
  domain,
  key,
}: {
  domain: string;
  key: string;
}): Promise<QueryResult | null> => {
  const keyToQuery = isCaseSensitiveDomain(domain)
    ? encodeKey(key)
    : punyEncode(decodeURIComponent(key));

  const link = await prisma.link.findFirst({
    where: { domain, key: keyToQuery },
    include: {
      programEnrollment: {
        include: {
          partner: { select: { id: true, name: true, image: true } },
          discount: true,
        },
      },
    },
  });

  if (!link) return null;

  const en = link.programEnrollment;
  return {
    ...(link as unknown as EdgeLinkProps),
    key: decodeKeyIfCaseSensitive({ domain, key: link.key }),
    partner: en?.partner
      ? {
          id: en.partner.id,
          name: en.partner.name,
          image: en.partner.image,
          groupId: en.groupId ?? undefined,
          tenantId: en.tenantId ?? undefined,
        }
      : null,
    discount:
      en?.discount ?
        {
          id: en.discount.id,
          amount: en.discount.amount,
          type: en.discount.type,
          maxDuration: en.discount.maxDuration,
          couponId: en.discount.couponId,
          couponTestId: en.discount.couponTestId,
        }
      : null,
  };
};
