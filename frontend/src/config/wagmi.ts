import { http, createConfig } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
    appName: "Agent Arena",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
    chains: [avalancheFuji],
    transports: {
        [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
    },
    ssr: true,
});
