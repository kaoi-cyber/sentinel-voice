import { BookOpenText } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata = { title: "VoiceGuard AI — Sentinel Voice" };

export default function LearnPage() {
  return (
    <PlaceholderPage
      icon={BookOpenText}
      eyebrow="Layer 1 · VoiceGuard AI"
      title="Learn crypto without feeling lost."
      intro="VoiceGuard AI will be your friendly guide to how crypto works — explained simply, by text or by voice."
      coming={[
        "Ask questions about Bitcoin, blockchains and wallets",
        "Understand volatility and long-term investment risk (education, not financial advice)",
        "Explore tokenomics and token unlocks",
        "Learn to recognise common scams",
        "Spoken answers powered by voice AI",
      ]}
    />
  );
}
