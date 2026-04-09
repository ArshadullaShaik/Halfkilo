// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/AgentNFT.sol";
import "../contracts/PetNFT.sol";
import "../contracts/IdentityRegistry.sol";
import "../contracts/ReputationRegistry.sol";
import "../contracts/TokenBoundAccount.sol";
import "../contracts/TBARegistry.sol";
import "../contracts/GameCore.sol";
import "../contracts/ItemNFT.sol";
import "../contracts/Marketplace.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // 1. Deploy NFT contracts
        AgentNFT agentNFT = new AgentNFT();
        console.log("AgentNFT:", address(agentNFT));

        PetNFT petNFT = new PetNFT();
        console.log("PetNFT:", address(petNFT));

        ItemNFT itemNFT = new ItemNFT();
        console.log("ItemNFT:", address(itemNFT));

        // 2. Deploy registries
        IdentityRegistry identityRegistry = new IdentityRegistry();
        console.log("IdentityRegistry:", address(identityRegistry));

        ReputationRegistry reputationRegistry = new ReputationRegistry();
        console.log("ReputationRegistry:", address(reputationRegistry));

        // 3. Deploy TBA system
        TokenBoundAccount tbaImpl = new TokenBoundAccount();
        console.log("TBA Implementation:", address(tbaImpl));

        TBARegistry tbaRegistry = new TBARegistry(address(tbaImpl));
        console.log("TBARegistry:", address(tbaRegistry));

        // 4. Deploy GameCore
        GameCore gameCore = new GameCore(
            address(agentNFT),
            address(petNFT),
            address(itemNFT),
            address(reputationRegistry),
            address(identityRegistry),
            address(tbaRegistry)
        );
        console.log("GameCore:", address(gameCore));

        // 5. Deploy Marketplace
        Marketplace marketplace = new Marketplace();
        console.log("Marketplace:", address(marketplace));

        // 6. Wire permissions – authorizations first, then ownership transfers
        itemNFT.setAuthorizedMinter(address(gameCore), true);
        petNFT.setAuthorizedUpdater(address(gameCore), true);
        reputationRegistry.setAuthorizedGame(address(gameCore));

        agentNFT.transferOwnership(address(gameCore));
        petNFT.transferOwnership(address(gameCore));
        identityRegistry.transferOwnership(address(gameCore));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("Set these in frontend/.env.local:");
        console.log("NEXT_PUBLIC_AGENT_NFT=", address(agentNFT));
        console.log("NEXT_PUBLIC_PET_NFT=", address(petNFT));
        console.log("NEXT_PUBLIC_ITEM_NFT=", address(itemNFT));
        console.log("NEXT_PUBLIC_IDENTITY_REGISTRY=", address(identityRegistry));
        console.log("NEXT_PUBLIC_REPUTATION_REGISTRY=", address(reputationRegistry));
        console.log("NEXT_PUBLIC_TBA_REGISTRY=", address(tbaRegistry));
        console.log("NEXT_PUBLIC_GAME_CORE=", address(gameCore));
        console.log("NEXT_PUBLIC_MARKETPLACE=", address(marketplace));
    }
}
