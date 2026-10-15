import { Terminal } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata = { title: "Expert Dashboard — Sentinel Voice" };

export default function ExpertPage() {
  return (
    <PlaceholderPage
      icon={Terminal}
      eyebrow="Expert workspace"
      title="Give me evidence, not just a warning."
      intro="The expert dashboard will show the raw evidence behind every Sentinel finding."
      coming={[
        "Spender, allowance, token and chain for each transaction",
        "Rule IDs, severity and evidence for every finding",
        "Structured JSON security report",
        "Report hash and Fuji testnet transaction link for verification",
        "Spoken summary of the technical report",
      ]}
    />
  );
}
