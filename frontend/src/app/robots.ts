import { NextResponse } from "next/server";

import { SEO_DOMAIN } from "@/lib/seo";

const content = `User-agent: *
Allow: /
Disallow: /perfil
Disallow: /panel
Disallow: /admin
Disallow: /api
Sitemap: ${SEO_DOMAIN}/sitemap.xml
`;

export function GET() {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
