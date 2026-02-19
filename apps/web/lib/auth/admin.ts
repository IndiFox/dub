import { prisma } from "@dub/prisma";
import { DUB_WORKSPACE_ID, getSearchParams } from "@dub/utils";
import { getSession } from "./utils";
import { isAdminByEnvEmail } from "./admin-env";

// Internal use only (for admin portal)
interface WithAdminHandler {
  ({
    req,
    params,
    searchParams,
  }: {
    req: Request;
    params: Record<string, string>;
    searchParams: Record<string, string>;
  }): Promise<Response>;
}

/** On self-hosted (no NEXT_PUBLIC_IS_DUB), allow admin by ADMIN_EMAILS env. */
export const isDubAdmin = async (
  userId: string,
  email?: string | null,
): Promise<boolean> => {
  if (isAdminByEnvEmail(email ?? undefined)) return true;

  const response = await prisma.projectUsers.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId: DUB_WORKSPACE_ID,
      },
    },
  });
  return !!response;
};

export const withAdmin =
  (handler: WithAdminHandler) =>
  async (
    req: Request,
    { params: initialParams }: { params: Promise<Record<string, string>> },
  ) => {
    const params = (await initialParams) || {};
    const session = await getSession();
    if (!session?.user) {
      return new Response("Unauthorized: Login required.", { status: 401 });
    }

    const isAdminUser = await isDubAdmin(
      session.user.id,
      (session.user as { email?: string }).email,
    );
    if (!isAdminUser) {
      return new Response("Unauthorized: Not an admin.", { status: 401 });
    }

    const searchParams = getSearchParams(req.url);
    return handler({ req, params, searchParams });
  };
