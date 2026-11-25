import { redirect } from "next/navigation";

export default async function InboxThreadRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isFinite(numericId) && numericId > 0) {
    redirect(`/inbox?thread=${numericId}`);
  }
  redirect("/inbox");
}
