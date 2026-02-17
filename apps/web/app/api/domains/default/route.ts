import { withWorkspace } from "@/lib/auth";
import { getDefaultDomainsQuerySchema } from "@/lib/zod/schemas/domains";
import { prisma } from "@dub/prisma";
import { DUB_DOMAINS_ARRAY, SHORT_DOMAIN } from "@dub/utils";
import { NextResponse } from "next/server";
import * as z from "zod/v4";

// Self-hosted: single default domain column (normalized short domain, e.g. ac.me -> acme)
const DEFAULT_DOMAIN_COLUMN = (SHORT_DOMAIN || "link.revroute.ru").replace(/\./g, "");

// GET /api/domains/default - get default domains
export const GET = withWorkspace(
  async ({ workspace, searchParams }) => {
    const { search } = getDefaultDomainsQuerySchema.parse(searchParams);

    const data = await prisma.defaultDomains.findUnique({
      where: {
        projectId: workspace.id,
      },
      select: { [DEFAULT_DOMAIN_COLUMN]: true },
    });

    let defaultDomains: string[] = [];

    if (data) {
      defaultDomains = Object.keys(data)
        .filter((key) => data[key as keyof typeof data])
        .map(
          (domain) =>
            DUB_DOMAINS_ARRAY.find((d) => d.replace(/\./g, "") === domain)!,
        )
        .filter(Boolean)
        .filter((domain) =>
          search ? domain?.toLowerCase().includes(search.toLowerCase()) : true,
        );
    }

    return NextResponse.json(defaultDomains);
  },
  {
    requiredPermissions: ["domains.read"],
  },
);

const updateDefaultDomainsSchema = z.object({
  defaultDomains: z.array(z.enum(DUB_DOMAINS_ARRAY as [string, ...string[]])),
});

// PATCH /api/domains/default - edit default domains
export const PATCH = withWorkspace(
  async ({ req, workspace }) => {
    const { defaultDomains } = await updateDefaultDomainsSchema.parseAsync(
      await req.json(),
    );

    const shortDomainSlug = SHORT_DOMAIN || "link.revroute.ru";
    const response = await prisma.defaultDomains.update({
      where: {
        projectId: workspace.id,
      },
      data: {
        [DEFAULT_DOMAIN_COLUMN]: defaultDomains.includes(shortDomainSlug),
      },
    });

    return NextResponse.json(response);
  },
  {
    requiredPermissions: ["domains.write"],
  },
);
