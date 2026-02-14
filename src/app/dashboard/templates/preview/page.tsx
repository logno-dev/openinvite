import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TemplatePreviewClient from "../TemplatePreviewClient";
import { getSessionUserByToken, SESSION_COOKIE } from "@/lib/session";

type TemplatePreviewPageProps = {
  searchParams: Promise<{ templateUrl?: string }>;
};

export default async function TemplatePreviewPage({ searchParams }: TemplatePreviewPageProps) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/auth");
  }

  const user = await getSessionUserByToken(token);

  if (!user) {
    redirect("/auth");
  }

  const templateUrl = resolvedParams.templateUrl ?? null;

  return <TemplatePreviewClient templateUrl={templateUrl} />;
}
