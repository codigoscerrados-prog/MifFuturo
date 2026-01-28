import type { MetadataRoute } from "next";

import { SEO_DOMAIN } from "@/lib/seo";

const ROBOTS_RULES = [
    {
        userAgent: ["*"],
        allow: ["/"],
        disallow: ["/perfil", "/panel", "/admin", "/api"],
    },
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: ROBOTS_RULES,
        host: new URL(SEO_DOMAIN).host,
        sitemap: `${SEO_DOMAIN}/sitemap.xml`,
    };
}
