// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/AgentNFT.sol";
import "../contracts/PetNFT.sol";
import "../contracts/IdentityRegistry.sol";
import "../contracts/ReputationRegistry.sol";
import "../contracts/TokenBoundAccount.sol";
import "../contracts/TBARegistry.sol";
import "../contracts/GameCore.sol";
import "../contracts/ItemNFT.sol";
import "../contracts/Marketplace.sol";

contract AgentArenaTest is Test {
    AgentNFT agentNFT;
    PetNFT petNFT;
    ItemNFT itemNFT;
    IdentityRegistry identityRegistry;
    ReputationRegistry reputationRegistry;
    TokenBoundAccount tbaImpl;
    TBARegistry tbaRegistry;
    GameCore gameCore;
    Marketplace marketplace;

    address deployer = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        // Deploy all contracts
        agentNFT = new AgentNFT();
        petNFT = new PetNFT();
        itemNFT = new ItemNFT();
        identityRegistry = new IdentityRegistry();
        reputationRegistry = new ReputationRegistry();
        tbaImpl = new TokenBoundAccount();
        tbaRegistry = new TBARegistry(address(tbaImpl));

        gameCore = new GameCore(
            address(agentNFT),
            address(petNFT),
            address(itemNFT),
            address(reputationRegistry),
            address(identityRegistry),
            address(tbaRegistry)
        );

        marketplace = new Marketplace();

        // Wire permissions — set authorizations BEFORE transferring ownership
        itemNFT.setAuthorizedMinter(address(gameCore), true);
        petNFT.setAuthorizedUpdater(address(gameCore), true);
        reputationRegistry.setAuthorizedGame(address(gameCore));

        // Transfer ownership last (after this, test contract can no longer call onlyOwner)
        agentNFT.transferOwnership(address(gameCore));
        petNFT.transferOwnership(address(gameCore));
        identityRegistry.transferOwnership(address(gameCore));

        // Fund test accounts
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    // ───── Agent Registration ─────

    function test_registerAgent() public {
        uint256 agentId = gameCore.registerAgent(alice, "Warrior Alpha", "ipfs://meta1");

        assertEq(agentId, 1);
        assertEq(agentNFT.ownerOf(1), alice);

        (string memory name, uint256 level) = agentNFT.getAgent(1);
        assertEq(name, "Warrior Alpha");
        assertEq(level, 1);

        assertTrue(gameCore.registered(1));
    }

    function test_identityRegistered() public {
        gameCore.registerAgent(alice, "Mage Beta", "ipfs://meta2");

        (string memory name, string memory uri) = identityRegistry.getIdentity(1);
        assertEq(name, "Mage Beta");
        assertEq(uri, "ipfs://meta2");
    }

    function test_reputationInitialized() public {
        gameCore.registerAgent(alice, "Rogue", "ipfs://meta3");

        (uint256 wins, uint256 losses, uint256 score) = reputationRegistry.getReputation(1);
        assertEq(wins, 0);
        assertEq(losses, 0);
        assertEq(score, 1000);
    }

    // ───── Pet System ─────

    function test_registerAndAssignPet() public {
        gameCore.registerAgent(alice, "Hero", "ipfs://meta5");
        uint256 petId = gameCore.registerAndAssignPet(1, "Flame Fox", 2);

        assertEq(petId, 1);
        assertEq(petNFT.ownerOf(1), alice);
        assertEq(gameCore.assignedPet(1), 1);

        (string memory name, uint8 mood, uint8 personality) = petNFT.getPet(1);
        assertEq(name, "Flame Fox");
        assertEq(mood, 0);
        assertEq(personality, 2);
    }

    function test_cannotAssignTwoPets() public {
        gameCore.registerAgent(alice, "Hero", "ipfs://meta5");
        gameCore.registerAndAssignPet(1, "Pet A", 0);

        vm.expectRevert("Agent already has a pet");
        gameCore.registerAndAssignPet(1, "Pet B", 1);
    }

    function test_updatePetMood() public {
        gameCore.registerAgent(alice, "Hero", "ipfs://meta5");
        gameCore.registerAndAssignPet(1, "Buddy", 1);

        gameCore.updatePetMood(1, 4); // set to excited

        (, uint8 mood,) = petNFT.getPet(1);
        assertEq(mood, 4);
    }

    // ───── Battle System ─────

    function test_battle() public {
        gameCore.registerAgent(alice, "Fighter A", "ipfs://a");
        gameCore.registerAgent(bob, "Fighter B", "ipfs://b");
        gameCore.registerAndAssignPet(1, "Pet A", 1);
        gameCore.registerAndAssignPet(2, "Pet B", 2);

        // Set moods
        gameCore.updatePetMood(1, 1); // happy
        gameCore.updatePetMood(2, 4); // excited

        (uint256 winner, uint256 lootId) = gameCore.battle(1, 2);

        assertTrue(winner == 1 || winner == 2, "Winner must be one of the fighters");
        assertTrue(lootId > 0, "Loot should be minted");

        // Winner gets reputation boost
        uint256 loser = winner == 1 ? 2 : 1;
        (uint256 wWins,,) = reputationRegistry.getReputation(winner);
        (,uint256 lLosses,) = reputationRegistry.getReputation(loser);
        assertEq(wWins, 1);
        assertEq(lLosses, 1);

        // Loot goes to winner's EOA
        address winnerEOA = agentNFT.ownerOf(winner);
        assertEq(itemNFT.ownerOf(lootId), winnerEOA);
    }

    function test_cannotBattleSelf() public {
        gameCore.registerAgent(alice, "Solo", "ipfs://s");

        vm.expectRevert("Cannot battle self");
        gameCore.battle(1, 1);
    }

    function test_cannotBattleUnregistered() public {
        gameCore.registerAgent(alice, "Solo", "ipfs://s");

        vm.expectRevert("Both agents must be registered");
        gameCore.battle(1, 2);
    }

    // ───── Marketplace ─────

    function test_listAndBuyItem() public {
        // Register two agents and battle to mint loot
        gameCore.registerAgent(alice, "Seller", "ipfs://sell");
        gameCore.registerAgent(bob, "Buyer", "ipfs://buy");
        (uint256 winner, uint256 lootId) = gameCore.battle(1, 2);

        // Determine winner's EOA
        address lootOwnerEOA = agentNFT.ownerOf(winner) == alice ? alice : bob;
        require(itemNFT.ownerOf(lootId) == lootOwnerEOA, "Loot minting failed");

        // Owner approves marketplace, then lists directly (no TBA needed)
        vm.startPrank(lootOwnerEOA);
        itemNFT.approve(address(marketplace), lootId);
        marketplace.listItem(address(itemNFT), lootId, 1 ether);
        vm.stopPrank();

        // Other user buys
        address buyer = lootOwnerEOA == alice ? bob : alice;
        vm.prank(buyer);
        marketplace.buyItem{value: 1 ether}(1);

        assertEq(itemNFT.ownerOf(lootId), buyer);
    }

    function test_cancelListing() public {
        // Mint item directly for simplicity
        uint256 itemId = itemNFT.mint(alice, "Test Item", 10, 0);

        vm.startPrank(alice);
        itemNFT.approve(address(marketplace), itemId);
        uint256 listingId = marketplace.listItem(address(itemNFT), itemId, 1 ether);
        marketplace.cancelListing(listingId);
        vm.stopPrank();

        (, , , , bool active) = marketplace.listings(listingId);
        assertFalse(active);
    }

    // ───── TBA Ownership ─────

    function test_tbaReceivesETH() public {
        gameCore.registerAgent(alice, "Rich", "ipfs://r");
        
        // Manually create TBA since it's no longer automatic
        address tba = tbaRegistry.createAccount(address(agentNFT), 1);

        vm.deal(address(this), 1 ether);
        (bool ok,) = tba.call{value: 1 ether}("");
        assertTrue(ok);
        assertEq(tba.balance, 1 ether);
    }
}
