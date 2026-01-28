"use client";

import { useRouter } from "next/navigation";
import SeccionHero from "@/secciones/SeccionHero/SeccionHero";
import type { FiltrosBusqueda } from "@/secciones/BusquedaDeCancha/BusquedaDeCancha";
import SeccionImpacto from "@/secciones/SeccionImpacto/SeccionImpacto";
import SeccionLoNuevo from "@/secciones/SeccionLoNuevo/SeccionLoNuevo";
import SeccionQuePuedesHacer from "@/secciones/SeccionQuePuedesHacer/SeccionQuePuedesHacer";
import CTAPropietarios from "@/secciones/CTAPropietarios/CTAPropietarios";
import ComparativaPlanes from "@/secciones/ComparativaPlanes/ComparativaPlanes";

export default function HomeClient() {
    const router = useRouter();

    function irABusqueda(f: FiltrosBusqueda) {
        const params = new URLSearchParams();
        if (f.departamento) params.set("departamento", f.departamento);
        if (f.provincia) params.set("provincia", f.provincia);
        if (f.distrito) params.set("distrito", f.distrito);
        if (f.tipo) params.set("tipo", f.tipo);
        if (typeof f.precioMax === "number") params.set("precioMax", String(f.precioMax));
        router.push(`/busqueda?${params.toString()}`);
    }

    return (
        <>
            <SeccionHero onBuscar={irABusqueda} />
            <SeccionImpacto />
            <SeccionLoNuevo />
            <CTAPropietarios />
            <ComparativaPlanes />
            <SeccionQuePuedesHacer />
        </>
    );
}
