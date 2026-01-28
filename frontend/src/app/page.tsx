import { buildPageMetadata } from "@/lib/seo";
import HomeClient from "./HomeClient";

export const metadata = buildPageMetadata({
    title: "LateralVerde | Busca y reserva canchas sintéticas",
    description:
        "Encuentra canchas sintéticas en Lima, Arequipa y todo Perú. Compara horarios, precios y confirma tu reserva en LateralVerde.",
});

export default function Page() {
    return (
        <>
            <main>
                <HomeClient />
            </main>
        </>
    );
}
