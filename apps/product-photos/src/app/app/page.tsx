"use client";
import { useState } from "react";
import { DashboardHeader } from "@/components/tool/DashboardHeader";
import { ProductPhotoTool } from "@/components/tool/ProductPhotoTool";
import { CreationsPanel } from "@/components/tool/CreationsPanel";

export function AppClient({
  initialCredits, user,
}: {
  initialCredits: number;
  user: { name: string | null; email: string };
}) {
  const [view, setView] = useState<"tool" | "creations">("tool");

  function handleMyCreations() {
    setView("creations");
  }

  function handleBackToTool() {
    setView("tool");
  }

  return (
    <>
      <DashboardHeader
        name={user.name}
        email={user.email}
        credits={initialCredits}
        onMyCreations={handleMyCreations}
      />
      <main className="mx-auto max-w-7xl px-6 py-10">
        {view === "creations" ? (
          <CreationsPanel onBack={handleBackToTool} />
        ) : (
          <ProductPhotoTool initialCredits={initialCredits} />
        )}
      </main>
    </>
  );
}

export default AppClient;
