export const GameCoreABI = [
    { type: "constructor", inputs: [{ name: "_agentNFT", type: "address" }, { name: "_petNFT", type: "address" }, { name: "_itemNFT", type: "address" }, { name: "_reputationRegistry", type: "address" }, { name: "_identityRegistry", type: "address" }, { name: "_tbaRegistry", type: "address" }] },
    { type: "function", name: "registerAgent", inputs: [{ name: "to", type: "address" }, { name: "name", type: "string" }, { name: "class_", type: "string" }, { name: "metadataURI", type: "string" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable" },
    { type: "function", name: "registerAndAssignPet", inputs: [{ name: "agentId", type: "uint256" }, { name: "petName", type: "string" }, { name: "personality", type: "uint8" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable" },
    { type: "function", name: "updatePetMood", inputs: [{ name: "petId", type: "uint256" }, { name: "newMood", type: "uint8" }], outputs: [], stateMutability: "nonpayable" },
    { type: "function", name: "battle", inputs: [{ name: "agentA", type: "uint256" }, { name: "agentB", type: "uint256" }], outputs: [{ name: "winner", type: "uint256" }, { name: "lootId", type: "uint256" }], stateMutability: "nonpayable" },
    { type: "function", name: "registered", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "view" },
    { type: "function", name: "assignedPet", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
    { type: "event", name: "AgentRegistered", inputs: [{ name: "agentId", type: "uint256", indexed: true }, { name: "owner", type: "address", indexed: true }] },
    { type: "event", name: "PetAssigned", inputs: [{ name: "agentId", type: "uint256", indexed: true }, { name: "petId", type: "uint256", indexed: true }] },
    { type: "event", name: "BattleResolved", inputs: [{ name: "agentA", type: "uint256", indexed: true }, { name: "agentB", type: "uint256", indexed: true }, { name: "winner", type: "uint256" }, { name: "lootId", type: "uint256" }] },
    { type: "event", name: "MoodUpdated", inputs: [{ name: "petId", type: "uint256", indexed: true }, { name: "newMood", type: "uint8" }] },
] as const;

export const AgentNFTABI = [
    { type: "function", name: "getAgent", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "name", type: "string" }, { name: "class_", type: "string" }], stateMutability: "view" },
    { type: "function", name: "ownerOf", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
    { type: "function", name: "totalSupply", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
    { type: "function", name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

export const PetNFTABI = [
    { type: "function", name: "getPet", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "name", type: "string" }, { name: "mood", type: "uint8" }, { name: "personality", type: "uint8" }], stateMutability: "view" },
    { type: "function", name: "ownerOf", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
    { type: "function", name: "totalSupply", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

export const ItemNFTABI = [
    { type: "function", name: "getItem", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "name", type: "string" }, { name: "power", type: "uint256" }, { name: "rarity", type: "uint8" }], stateMutability: "view" },
    { type: "function", name: "ownerOf", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
    { type: "function", name: "totalSupply", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
    { type: "function", name: "approve", inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

export const ReputationRegistryABI = [
    { type: "function", name: "getReputation", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "wins", type: "uint256" }, { name: "losses", type: "uint256" }, { name: "score", type: "uint256" }], stateMutability: "view" },
] as const;

export const MarketplaceABI = [
    { type: "function", name: "listItem", inputs: [{ name: "nftContract", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable" },
    { type: "function", name: "buyItem", inputs: [{ name: "listingId", type: "uint256" }], outputs: [], stateMutability: "payable" },
    { type: "function", name: "cancelListing", inputs: [{ name: "listingId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
    { type: "function", name: "listings", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "seller", type: "address" }, { name: "nftContract", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }], stateMutability: "view" },
    { type: "event", name: "Listed", inputs: [{ name: "listingId", type: "uint256", indexed: true }, { name: "seller", type: "address", indexed: true }, { name: "nftContract", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }] },
    { type: "event", name: "Sold", inputs: [{ name: "listingId", type: "uint256", indexed: true }, { name: "buyer", type: "address", indexed: true }, { name: "price", type: "uint256" }] },
] as const;

export const TBARegistryABI = [
    { type: "function", name: "getAccount", inputs: [{ name: "tokenContract", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
] as const;
