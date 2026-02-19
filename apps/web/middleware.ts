import { logger } from "@/lib/axiom/server";
import { transformMiddlewareRequest } from "@axiomhq/nextjs";
import {
  ADMIN_HOSTNAMES,
  API_HOSTNAMES,
  APP_HOSTNAMES,
  DEFAULT_REDIRECTS,
  isValidUrl,
} from "@dub/utils";
import { PARTNERS_HOSTNAMES } from "@dub/utils/src/constants";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { AdminMiddleware } from "./lib/middleware/admin";
import { ApiMiddleware } from "./lib/middleware/api";
import { AppMiddleware } from "./lib/middleware/app";
import { CreateLinkMiddleware } from "./lib/middleware/create-link";
import { PartnersMiddleware } from "./lib/middleware/partners";
// LinkMiddleware imported dynamically to avoid pulling @upstash/qstash into Edge (uses process.versions)
import { parse } from "./lib/middleware/utils/parse";
import { supportedWellKnownFiles } from "./lib/well-known";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_proxy/ (proxies for third-party services)
     * 4. Metadata files: favicon.ico, sitemap.xml, robots.txt, manifest.webmanifest
     */
    "/((?!api/|_next/|_proxy/|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)",
  ],
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  try {
    const host = (req.headers.get("host") ?? "").toLowerCase().replace(/^www\./, "");
    // Vercel deployment URLs: serve app (avoids LinkMiddleware + Edge-incompatible qstash)
    if (host.endsWith(".vercel.app")) {
      return await AppMiddleware(req);
    }
    // Custom app domain: ensure app.revroute.ru always hits AppMiddleware (no reliance on NEXT_PUBLIC_APP_DOMAIN at runtime)
    if (host === "app.revroute.ru" || host === "preview.revroute.ru") {
      return await AppMiddleware(req);
    }

    const { domain, path, key, fullKey } = parse(req);

    // Axiom logging
    logger.info(...transformMiddlewareRequest(req));
    ev.waitUntil(logger.flush());

    if (APP_HOSTNAMES.has(domain)) {
      return AppMiddleware(req);
    }
    if (API_HOSTNAMES.has(domain)) {
      return ApiMiddleware(req);
    }
    if (path.startsWith("/stats/")) {
      return NextResponse.rewrite(new URL(`/${domain}${path}`, req.url));
    }
    if (path.startsWith("/.well-known/")) {
      const file = path.split("/.well-known/").pop();
      if (file && supportedWellKnownFiles.includes(file)) {
        return NextResponse.rewrite(
          new URL(`/wellknown/${domain}/${file}`, req.url),
        );
      }
    }
    if (domain === "dub.sh" && DEFAULT_REDIRECTS[key]) {
      return NextResponse.redirect(DEFAULT_REDIRECTS[key]);
    }
    if (ADMIN_HOSTNAMES.has(domain)) {
      return AdminMiddleware(req);
    }
    if (PARTNERS_HOSTNAMES.has(domain)) {
      return PartnersMiddleware(req);
    }
    if (isValidUrl(fullKey)) {
      return CreateLinkMiddleware(req);
    }

    const { LinkMiddleware } = await import("./lib/middleware/link");
    return LinkMiddleware(req, ev);
  } catch (err) {
    console.error("[middleware]", err);
    throw err;
  }
}
