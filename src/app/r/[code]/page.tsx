import { Suspense } from "react";
import { Room } from "./room";

export default function Page({ params }: PageProps<"/r/[code]">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">読み込み中…</main>}>
      <RoomLoader params={params} />
    </Suspense>
  );
}

async function RoomLoader({ params }: { params: PageProps<"/r/[code]">["params"] }) {
  const { code } = await params;
  return <Room code={code.toUpperCase()} />;
}
