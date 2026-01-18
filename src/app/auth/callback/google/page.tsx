"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRoleFromToken, rutaPorRole, setToken } from "@/lib/auth";

export default function GoogleCallback() {
    const router = useRouter();
    const params = useSearchParams();
    const [error, setError] = useState("");

    useEffect(() => {
        const token = params.get("token");
        const needsProfile = params.get("needs_profile");

        if (!token) {
            setError("No se recibio el token de Google.");
            return;
        }

        setToken(token);

        const role = getRoleFromToken(token);
        router.replace(rutaPorRole(role));
    }, [params, router]);

    return (
        <section style={{ padding: "24px" }}>
            <h1>Procesando acceso...</h1>
            {error ? <p>{error}</p> : <p>Redirigiendo...</p>}
        </section>
    );
}
