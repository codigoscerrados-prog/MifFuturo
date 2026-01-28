import SeccionPlanesPropietario from "@/secciones/SeccionPlanesPropietario/SeccionPlanesPropietario";

export const metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function Page() {
    return <SeccionPlanesPropietario />;
}
