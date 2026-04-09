"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const COMMANDS = [
    { href: "/register", icon: "⚔️", label: "RECRUIT" },
    { href: "/battle", icon: "💥", label: "BATTLE" },
    { href: "/marketplace", icon: "💰", label: "TRADE" },
    { href: "/inventory", icon: "🎒", label: "LOOT" },
];

export function CommandBar() {
    const pathname = usePathname();

    return (
        <nav className="command-bar">
            {/* Home */}
            <Link href="/" className={`cmd-btn ${pathname === "/" ? "active" : ""}`}>
                <span className="cmd-icon">🏠</span>
                <span className="cmd-label">BASE</span>
            </Link>

            {COMMANDS.map((cmd, i) => (
                <Link
                    key={i}
                    href={cmd.href}
                    className={`cmd-btn ${pathname === cmd.href ? "active" : ""}`}
                >
                    <span className="cmd-icon">{cmd.icon}</span>
                    <span className="cmd-label">{cmd.label}</span>
                </Link>
            ))}
        </nav>
    );
}
