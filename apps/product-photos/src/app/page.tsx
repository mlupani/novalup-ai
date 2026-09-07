import { LandingHero } from "@/components/landing/LandingHero";

// The hero advertises FREE_CREDITS, which only exists in the runtime environment
// (compose passes it at `up`, not at image build). Prerendering this page would
// bake in the build-time default and promise a different number than signup
// actually grants, so render it per request.
export const dynamic = "force-dynamic";

export default function LandingPage() {
  return <LandingHero />;
}
