// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentNFT.sol";
import "./PetNFT.sol";
import "./ItemNFT.sol";
import "./ReputationRegistry.sol";
import "./IdentityRegistry.sol";
import "./TBARegistry.sol";

/// @title GameCore – Central game logic for Agent Arena
contract GameCore is Ownable {
    AgentNFT public agentNFT;
    PetNFT public petNFT;
    ItemNFT public itemNFT;
    ReputationRegistry public reputationRegistry;
    IdentityRegistry public identityRegistry;
    TBARegistry public tbaRegistry;

    // agentTokenId => petTokenId (0 = no pet)
    mapping(uint256 => uint256) public assignedPet;
    // agentTokenId => registered
    mapping(uint256 => bool) public registered;

    // Strict 1 Character per Wallet enforced mappings
    mapping(address => bool) public hasCharacter;
    mapping(address => uint256) public characterOf;

    uint256 private _nonce;

    // Loot tables
    string[] private _itemNames;
    uint256[] private _itemPowers;

    event AgentRegistered(uint256 indexed agentId, address indexed owner);
    event PetAssigned(uint256 indexed agentId, uint256 indexed petId);
    event BattleResolved(uint256 indexed agentA, uint256 indexed agentB, uint256 winner, uint256 lootId);
    event MoodUpdated(uint256 indexed petId, uint8 newMood);

    constructor(
        address _agentNFT,
        address _petNFT,
        address _itemNFT,
        address _reputationRegistry,
        address _identityRegistry,
        address _tbaRegistry
    ) Ownable(msg.sender) {
        agentNFT = AgentNFT(_agentNFT);
        petNFT = PetNFT(_petNFT);
        itemNFT = ItemNFT(_itemNFT);
        reputationRegistry = ReputationRegistry(_reputationRegistry);
        identityRegistry = IdentityRegistry(_identityRegistry);
        tbaRegistry = TBARegistry(_tbaRegistry);

        // Seed some loot names
        _itemNames.push("Flame Sword");
        _itemNames.push("Ice Shield");
        _itemNames.push("Thunder Staff");
        _itemNames.push("Shadow Cloak");
        _itemNames.push("Crystal Helm");
        _itemPowers.push(50);
        _itemPowers.push(35);
        _itemPowers.push(60);
        _itemPowers.push(25);
        _itemPowers.push(45);
    }

    /// @notice Register a new character – enforces 1 per wallet
    function registerAgent(
        address to,
        string calldata name,
        string calldata metadataURI
    ) external onlyOwner returns (uint256) {
        require(!hasCharacter[to], "Wallet already has a character");
        uint256 agentId = agentNFT.mint(to, name);
        identityRegistry.registerIdentity(agentId, name, metadataURI);
        reputationRegistry.initReputation(agentId);

        hasCharacter[to] = true;
        characterOf[to] = agentId;
        registered[agentId] = true;
        emit AgentRegistered(agentId, to);
        return agentId;
    }

    /// @notice Allow users to spend AVAX to level up their character at the Dojo
    function levelUpCharacter(uint256 agentId) external payable {
        require(agentNFT.ownerOf(agentId) == msg.sender, "Not your character");
        require(msg.value >= 0.05 ether, "Insufficient AVAX for Level Up");

        (, uint256 currentLevel) = agentNFT.getAgent(agentId);
        agentNFT.setLevel(agentId, currentLevel + 1);
    }

    /// @notice Register a pet and assign it to an agent
    function registerAndAssignPet(
        uint256 agentId,
        string calldata petName,
        uint8 personality
    ) external onlyOwner returns (uint256) {
        require(registered[agentId], "Agent not registered");
        require(assignedPet[agentId] == 0, "Agent already has a pet");

        address agentOwner = agentNFT.ownerOf(agentId);
        uint256 petId = petNFT.mint(agentOwner, petName, personality);

        assignedPet[agentId] = petId;
        emit PetAssigned(agentId, petId);
        return petId;
    }

    /// @notice Update a pet's mood
    function updatePetMood(uint256 petId, uint8 newMood) external onlyOwner {
        petNFT.updateMood(petId, newMood);
        emit MoodUpdated(petId, newMood);
    }

    /// @notice Resolve a battle between two agents
    /// @dev Uses pseudo-random based on block data and agent stats – NOT for production
    function battle(uint256 agentA, uint256 agentB) external returns (uint256 winner, uint256 lootId) {
        require(registered[agentA] && registered[agentB], "Both agents must be registered");
        require(agentA != agentB, "Cannot battle self");

        // Calculate battle scores
        uint256 scoreA = _battleScore(agentA);
        uint256 scoreB = _battleScore(agentB);

        // Pseudo-random resolution
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            agentA,
            agentB,
            _nonce++
        )));

        uint256 totalScore = scoreA + scoreB;
        winner = (random % totalScore) < scoreA ? agentA : agentB;
        uint256 loser = winner == agentA ? agentB : agentA;

        // Update reputations
        reputationRegistry.recordWin(winner);
        reputationRegistry.recordLoss(loser);

        // Mint loot directly to winner's EOA wallet
        address winnerOwner = agentNFT.ownerOf(winner);

        uint256 lootIndex = random % _itemNames.length;
        uint8 rarity = uint8((random / 100) % 5);
        lootId = itemNFT.mint(
            winnerOwner,
            _itemNames[lootIndex],
            _itemPowers[lootIndex] + (rarity * 10),
            rarity
        );

        emit BattleResolved(agentA, agentB, winner, lootId);
        return (winner, lootId);
    }

    /// @dev Calculate a battle score from reputation and pet mood
    function _battleScore(uint256 agentId) internal view returns (uint256) {
        (,, uint256 repScore) = reputationRegistry.getReputation(agentId);
        uint256 moodBonus = 0;

        uint256 petId = assignedPet[agentId];
        if (petId != 0) {
            (, uint8 mood,) = petNFT.getPet(petId);
            // happy and excited moods give bonuses
            if (mood == 1) moodBonus = 20;  // happy
            else if (mood == 4) moodBonus = 30; // excited
            else if (mood == 2) moodBonus = 15; // angry – slight boost
        }

        (, uint256 currentLevel) = agentNFT.getAgent(agentId);
        uint256 levelBonus = currentLevel * 10;

        return repScore + moodBonus + levelBonus + 10; // base 10 so score is never zero
    }
}
