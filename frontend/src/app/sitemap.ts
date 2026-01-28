import type { MetadataRoute } from "next";

import { apiUrl } from "@/lib/api";
import { SEO_DOMAIN } from "@/lib/seo";

type SitemapChangeFrequency =
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";

type StaticRoute = {
    path: string;
    changefreq: SitemapChangeFrequency;
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date().toISOString();
    const dynamicComplejos = await fetchComplejos();
    const dynamicEntries: MetadataRoute.Sitemap = dynamicComplejos
        .filter((item: any) => typeof item?.slug === "string")
        .map((item: any) => {
            const slug = encodeURIComponent(item.slug);
            const loc = `${SEO_DOMAIN}/${slug}`;
            const updated = item.updated_at || item.updatedAt || item.modified_at || item.modifiedAt;
            const lastmod = updated ? new Date(updated).toISOString() : now;
            return {
                url: loc,
                lastModified: lastmod,
                changeFrequency: "weekly" as SitemapChangeFrequency,
                priority: 0.7,
            };
        });

    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
        url: `${SEO_DOMAIN}${route.path}`,
        lastModified: now,
        changeFrequency: route.changefreq,
        priority: route.priority,
    }));

    return [...staticEntries, ...dynamicEntries];
}
