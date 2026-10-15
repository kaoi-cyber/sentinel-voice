import { Info } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata = { title: "About — Sentinel Voice" };

export default function AboutPage() {
  return (
    <PlaceholderPage
      icon={Info}
      eyebrow="About"
      title="One security engine. Two ways to understand it."
      intro="Sentinel Voice pairs a deterministic security engine with AI that explains its findings — simply for newcomers, technically for experts. The rules produce the findings; the AI only explains them."
      coming={[
        "Education → Research → Security analysis → Verification",
        "Built for U-Hackathon 2026",
        "Educational only — not financial advice, and no check can guarantee a transaction is safe",
      ]}
    />
  );
}
