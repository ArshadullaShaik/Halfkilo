// Contract addresses loaded from environment variables
export const CONTRACTS = {
    agentNFT: (process.env.NEXT_PUBLIC_AGENT_NFT || "") as `0x${string}`,
    petNFT: (process.env.NEXT_PUBLIC_PET_NFT || "") as `0x${string}`,
    itemNFT: (process.env.NEXT_PUBLIC_ITEM_NFT || "") as `0x${string}`,
    identityRegistry: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || "") as `0x${string}`,
    reputationRegistry: (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY || "") as `0x${string}`,
    tbaRegistry: (process.env.NEXT_PUBLIC_TBA_REGISTRY || "") as `0x${string}`,
    gameCore: (process.env.NEXT_PUBLIC_GAME_CORE || "") as `0x${string}`,
    marketplace: (process.env.NEXT_PUBLIC_MARKETPLACE || "") as `0x${string}`,
} as const;
