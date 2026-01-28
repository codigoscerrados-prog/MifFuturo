import type { Metadata } from "next";

import { apiFetch } from "@/lib/api";
import { buildPageMetadata, SEO_DOMAIN } from "@/lib/seo";
import { publicImgUrl } from "@/lib/publicImage";
import ComplejoPublicoClient from "./ComplejoPublicoClient";

type Params = {
    params: { slug?: string | string[] };
};

type ComplejoPerfilMeta = {
    nombre: string;
    descripcion?: string | null;
    distrito?: string | null;
    provincia?: string | null;
    departamento?: string | null;
    foto_url?: string | null;
    imagenes?: { url?: string | null }[];
};

const FALLBACK_METADATA = {
    title: "LateralVerde | Complejo deportivo",
    description: "Reserva canchas sintéticas en Perú con LateralVerde.",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
    if (!slug) {
        return buildPageMetadata({
            ...FALLBACK_METADATA,
            path: "/",
        });
    }

    try {
        const data = await apiFetch<ComplejoPerfilMeta>(`/public/complejos/${slug}`);
        const zona = [data.distrito, data.provincia, data.departamento].filter(Boolean).join(", ");
        const locationText = zona || "Perú";
        const title = `${data.nombre} en ${locationText} | Reservar cancha`;
        const baseDescription = data.descripcion
            ? `${data.descripcion} Reserva canchas sintéticas y confirma tu turno en LateralVerde.`
            : `Reserva una cancha en ${data.nombre} (${locationText}) a través de LateralVerde.`;
        const image = publicImgUrl(data.foto_url || data.imagenes?.[0]?.url) || undefined;
        return buildPageMetadata({
            title,
            description: baseDescription,
            path: `/${slug}`,
            image,
        });
    } catch {
        return buildPageMetadata({
            ...FALLBACK_METADATA,
            path: `/${slug}`,
        });
    }
}

export default function ComplejoPublicoPage() {
    return <ComplejoPublicoClient />;
}
