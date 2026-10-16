"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { asset } from "@/lib/staticDemo";

// One atmospheric image per section of the app. On desktop it sits on the right and fades into
// the navy page; on phones it sits behind the text under a darker wash so copy stays readable.
const BACKDROPS: { match: (p: string) => boolean; src: string }[] = [
  { match: (p) => p === "/", src: "/images/city-padlock.jpg" },
  { match: (p) => p.startsWith("/learn") || p.startsWith("/quiz"), src: "/images/street-phone.jpg" },
  { match: (p) => p.startsWith("/business"), src: "/images/security-team.jpg" },
  { match: (p) => p.startsWith("/about"), src: "/images/city-padlock.jpg" },
  { match: () => true, src: "/images/light-trails.jpg" },
];

export function PageBackdrop() {
  const pathname = usePathname();
  const src = BACKDROPS.find((b) => b.match(pathname))!.src;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[min(760px,100%)] overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-full md:w-[62%] [mask-image:linear-gradient(to_bottom,black_55%,transparent)] md:[mask-image:linear-gradient(to_left,black_45%,transparent),linear-gradient(to_bottom,black_55%,transparent)] md:[mask-composite:intersect]">
        <Image key={src} src={asset(src)} alt="" fill priority sizes="(min-width: 768px) 62vw, 100vw" className="object-cover object-center opacity-50 md:opacity-70" />
        {/* Palette wash: pulls every photo toward navy + violet so the brand colours stay in charge. */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet/25 via-ink/40 to-blue/20 mix-blend-multiply" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/30 to-ink md:from-ink/20 md:via-transparent" />
    </div>
  );
}
