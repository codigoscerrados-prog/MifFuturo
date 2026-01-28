import EditarComplejoClient from "./EditarComplejoClient";

export const metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function EditarComplejoPage() {
    return <EditarComplejoClient />;
}
