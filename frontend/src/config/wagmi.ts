import { createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

export const config = createConfig({
    chains: [avalancheFuji],
    connectors: [injected()],
    transports: {
        [avalancheFuji.id]: http(rpcUrl),
    },
    ssr: true,
});
