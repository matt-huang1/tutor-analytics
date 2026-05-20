"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/insights", label: "Insights" },
  { href: "/submit", label: "Submit" },
  { href: "/history", label: "History" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          AI Tutor <span className="text-accent">Analytics</span>
        </span>
        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                "px-5 py-3.5 text-sm font-medium -mb-px border-b-2 transition-colors duration-150",
                pathname === href
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
