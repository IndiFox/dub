import { prisma } from "@dub/prisma";
import { normalizeWorkspaceId } from "../api/workspaces/workspace-id";
import { WorkspaceProps } from "../types";

/** Uses Prisma so it works with Railway and PlanetScale. Only used from Node (API/track). */
export const getWorkspaceViaEdge = async ({
  workspaceId,
  includeDomains = false,
}: {
  workspaceId: string;
  includeDomains?: boolean;
}) => {
  const id = normalizeWorkspaceId(workspaceId);

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      domains: includeDomains ? { select: { slug: true } } : false,
    },
  });

  if (!project) return null;

  const workspaceData = project as unknown as WorkspaceProps;
  if (!includeDomains) {
    return workspaceData;
  }

  return {
    ...workspaceData,
    domains: (project as any).domains?.map((d: { slug: string }) => ({ slug: d.slug })) ?? [],
  } as WorkspaceProps & { domains: { slug: string }[] };
};
