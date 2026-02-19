import { prisma } from "@dub/prisma";
import { redis } from "@/lib/upstash";
import { after } from "next/server";

/** Uses Prisma so it works with Railway. In Edge with stub prisma returns null → fallback "links". */
export const getWorkspaceProduct = async (workspaceSlug: string) => {
  try {
    let workspaceProduct = await redis.get<"program" | "links">(
      `workspace:product:${workspaceSlug}`,
    );
    if (workspaceProduct) {
      return workspaceProduct;
    }

    const workspace = await prisma.project.findUnique({
      where: { slug: workspaceSlug },
      select: { defaultProgramId: true },
    });

    workspaceProduct = workspace?.defaultProgramId ? "program" : "links";

    after(async () => {
      await redis.set(`workspace:product:${workspaceSlug}`, workspaceProduct, {
        ex: 60 * 60 * 24 * 30, // cache for 30 days
      });
    });

    return workspaceProduct;
  } catch (error) {
    console.error(
      `Error getting workspace product for ${workspaceSlug}:`,
      error,
    );
    return "links";
  }
};
