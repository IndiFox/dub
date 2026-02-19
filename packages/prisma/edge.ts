import { Client } from "@planetscale/database";
import { PrismaPlanetScale } from "@prisma/adapter-planetscale";
import { PrismaClient } from "@prisma/client";

/** Prefer DATABASE_URL when PLANETSCALE_DATABASE_URL points to localhost (e.g. local proxy), so production (e.g. Vercel) always uses the real DB (e.g. Railway). */
function getEdgeDatabaseUrl(): string {
  const planScale = process.env.PLANETSCALE_DATABASE_URL;
  const db = process.env.DATABASE_URL;
  if (planScale && !/localhost|127\.0\.0\.1/.test(planScale)) return planScale;
  return db || planScale || "";
}

/** Edge runtime only supports PlanetScale driver (HTTP). Railway/generic MySQL URL cannot be used here — use stub so middleware doesn't crash. */
function isPlanetScaleUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const host = url.match(/@([^/]+)/)?.[1] ?? "";
  return host.includes("psdb.cloud") || host.includes("planetscale");
}

const edgeUrl = getEdgeDatabaseUrl();
const usePlanetScale = isPlanetScaleUrl(edgeUrl);

/** True when Edge has a working DB connection (PlanetScale). False when using Railway or other MySQL — then prismaEdge is a stub. */
export const edgeDbAvailable = usePlanetScale;

let _prismaEdge: PrismaClient;

if (usePlanetScale) {
  const client = new Client({ url: edgeUrl });
  const adapter = new PrismaPlanetScale(client);
  _prismaEdge = new PrismaClient({ adapter });
} else {
  // Stub: safe defaults for any model so Edge middleware doesn't throw. Node.js routes still use DATABASE_URL (Railway) via regular Prisma.
  const noop = async () => null;
  const zero = async () => 0;
  const modelStub = {
    findUnique: noop,
    findFirst: noop,
    findMany: async () => [],
    count: zero,
    update: noop,
    create: noop,
    delete: noop,
    deleteMany: zero,
  };
  const emptyClient = { $connect: async () => {}, $disconnect: async () => {} };
  _prismaEdge = new Proxy(emptyClient as unknown as PrismaClient, {
    get(target, prop) {
      if (prop === "$connect" || prop === "$disconnect") return (target as any)[prop];
      return modelStub;
    },
  }) as PrismaClient;
}

export const prismaEdge = _prismaEdge;
