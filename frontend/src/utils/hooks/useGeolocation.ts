"use client";

import { useCallback, useEffect, useState } from "react";

export type LatLng = {
    lat: number;
    lng: number;
};

const GEO_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
};

export type UseGeolocationResult = {
    position: LatLng | null;
    loading: boolean;
    error: string | null;
    permissionDenied: boolean;
    requestLocation: () => void;
};

export function useGeolocation(): UseGeolocationResult {
    const [position, setPosition] = useState<LatLng | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const requestLocation = useCallback(() => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setLoading(false);
            setError("Tu navegador no soporta geolocalización.");
            setPermissionDenied(false);
            setPosition(null);
            return;
        }

        setLoading(true);
        setError(null);
        setPermissionDenied(false);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setLoading(false);
                setError(null);
                setPermissionDenied(false);
            },
            (err) => {
                setLoading(false);
                setPosition(null);
                const message =
                    err.code === 1
                        ? "Necesitamos permiso para usar tu ubicación."
                        : err.code === 3
                        ? "El GPS tardó demasiado en responder."
                        : err.message || "No se pudo obtener tu ubicación.";
                setError(message);
                setPermissionDenied(err.code === 1);
            },
            GEO_OPTIONS
        );
    }, []);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    return {
        position,
        loading,
        error,
        permissionDenied,
        requestLocation,
    };
}
