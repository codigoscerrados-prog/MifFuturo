import { mediaUrl } from "@/lib/api";

export function publicImgUrl(url?: string | null) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `https:${url}`;
    const normalized = url.startsWith("/") ? url : `/${url}`;
    const isBackendPath = normalized.startsWith("/uploads/") || normalized.startsWith("/static/");
    if (isBackendPath) {
        return mediaUrl(normalized, normalized, { forceProxy: true }) || normalized;
    }
    return normalized;
}
