import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCredits } from "@/lib/credits/service";
import { ProductPhotoTool } from "@/components/tool/ProductPhotoTool";

export default async function AppPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const credits = await getCredits(user.id);
  return <ProductPhotoTool initialCredits={credits} user={{ name: user.name, email: user.email }} />;
}
