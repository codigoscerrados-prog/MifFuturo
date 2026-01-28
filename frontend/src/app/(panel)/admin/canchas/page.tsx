import SeccionAdminCanchas from "@/secciones/SeccionAdminCanchas/SeccionAdminCanchas";

export const metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminCanchasPage() {
    return (
        <main className="fondoSeccion fondoA espaciadoSeccion">
            <SeccionAdminCanchas />
        </main>
    );
}
