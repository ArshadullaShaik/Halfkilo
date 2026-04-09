"use client";

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const DynamicGameCanvas = dynamic(
    () => import('./GameCanvas'),
    { ssr: false }
);

export default function GlobalCanvas() {
    const pathname = usePathname();

    // Render Phaser only on the battle route.
    if (pathname !== '/battle') {
        return null;
    }

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
            <DynamicGameCanvas />
        </div>
    );
}
