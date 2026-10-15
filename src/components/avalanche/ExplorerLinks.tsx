import { ExternalLink } from "lucide-react";

export function ExplorerLinks({ links, label }: { links: { name: string; url: string }[]; label?: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {label && <span className="text-muted">{label}</span>}
      {links.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-blue hover:text-blue/80"
        >
          {l.name} <ExternalLink size={12} />
        </a>
      ))}
    </span>
  );
}
