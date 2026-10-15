import { ShieldAlert } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata = { title: "Sentinel AI — Sentinel Voice" };

export default function SecurityPage() {
  return (
    <PlaceholderPage
      icon={ShieldAlert}
      eyebrow="Layer 2 · Sentinel AI"
      title="Check before you sign."
      intro="Sentinel AI will inspect a transaction and explain what it really does — in plain language."
      coming={[
        "Three sample scenarios: ordinary transfer, unlimited approval, unknown spender",
        "Clear risk levels: high risk, unverified, or not enough information",
        "Beginner-friendly explanations of every finding",
        "Report fingerprints recorded on Avalanche Fuji testnet",
      ]}
    />
  );
}
