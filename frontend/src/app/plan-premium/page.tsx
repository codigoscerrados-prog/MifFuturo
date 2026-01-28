import SeccionPlanPremium from "@/secciones/SeccionPlanPremium/SeccionPlanPremium";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    title: "Planes para propietarios | Gestiona reservas",
    description:
        "Descubre los planes para propietarios en LateralVerde: publica tu cancha, controla horarios y recibe reservas en un solo panel.",
    path: "/plan-premium",
});

export default function Page() {
    return <SeccionPlanPremium />;
}
