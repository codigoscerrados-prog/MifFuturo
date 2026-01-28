import { NextResponse } from "next/server";

import { apiUrl } from "@/lib/api";
import { SEO_DOMAIN } from "@/lib/seo";

type StaticRoute = {
    path: string;
    changefreq: "daily" | "weekly" | "monthly";
    priority: number;
};

const STATIC_ROUTES: StaticRoute[] = [
    { path: "/", changefreq: "daily", priority: 1 },
    { path: "/busqueda", changefreq: "daily", priority: 0.9 },
    { path: "/plan-premium", changefreq: "weekly", priority: 0.8 },
    { path: "/contactanos", changefreq: "weekly", priority: 0.7 },
    { path: "/terminos", changefreq: "monthly", priority: 0.6 },
    { path: "/privacidad", changefreq: "monthly", priority: 0.6 },
    { path: "/cookies", changefreq: "monthly", priority: 0.6 },
    { path: "/reembolsos", changefreq: "monthly", priority: 0.6 },
    { path: "/aviso-responsabilidad", changefreq: "monthly", priority: 0.6 },
];

async function fetchComplejos() {
    try {
        const res = await fetch(apiUrl("/public/complejos"), {
            cache: "no-store",
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data)) return data;
        return [];
    } catch {
        return [];
    }
}

function renderUrl({ loc, lastmod, changefreq, priority }: { loc: string; lastmod?: string; changefreq: string; priority: number }) {
    const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
    return `
    <url>
      <loc>${loc}</loc>
      ${lastmodTag}
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
}

export async function GET() {
    const now = new Date().toISOString();
    const dynamicComplejos = await fetchComplejos();
    const dynamicUrls = dynamicComplejos
        .filter((item: any) => typeof item?.slug === "string")
        .map((item: any) => {
            const slug = encodeURIComponent(item.slug);
            const loc = `${SEO_DOMAIN}/${slug}`;
            const updated = item.updated_at || item.updatedAt || item.modified_at || item.modifiedAt;
            const lastmod = updated ? new Date(updated).toISOString() : now;
            return renderUrl({ loc, lastmod, changefreq: "weekly", priority: 0.7 });
        });

    const staticUrls = STATIC_ROUTES.map((route) =>
        renderUrl({
            loc: `${SEO_DOMAIN}${route.path}`,
            lastmod: now,
            changefreq: route.changefreq,
            priority: route.priority,
        }),
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...dynamicUrls].join("\n")}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml",
        },
    });
}
