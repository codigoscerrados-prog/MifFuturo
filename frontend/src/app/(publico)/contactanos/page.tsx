import SeccionContactanos from "@/secciones/SeccionContactanos/SeccionContactanos";
import { buildPageMetadata, SEO_DOMAIN } from "@/lib/seo";

const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: `${SEO_DOMAIN}/`,
        },
        {
            "@type": "ListItem",
            position: 2,
            name: "Contáctanos",
            item: `${SEO_DOMAIN}/contactanos`,
        },
    ],
});

export const metadata = buildPageMetadata({
    title: "Contacto | LateralVerde",
    description: "Escríbenos y conecta con soporte humano para reservar tu cancha, reportar un problema o conocer planes.",
    path: "/contactanos",
});

interface PageProps {
    searchParams?: {
        motivo?: "ayuda" | "contacto" | "problema";
    };
}

export default function PageContactanos({ searchParams }: PageProps) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbSchema }} />
            <main className="fondoSeccion fondoA espaciadoSeccion">
                <SeccionContactanos motivoQuery={searchParams?.motivo} />
            </main>
        </>
    );
}
