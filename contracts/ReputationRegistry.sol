// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationRegistry – ERC-8004 inspired reputation tracking
contract ReputationRegistry is Ownable {
    struct Reputation {
        uint256 wins;
        uint256 losses;
        uint256 score;
        bool exists;
    }

    mapping(uint256 => Reputation) public reputations;
    address public authorizedGame;

    event ReputationInitialized(uint256 indexed tokenId);
    event ReputationUpdated(uint256 indexed tokenId, uint256 wins, uint256 losses, uint256 score);
    event AuthorizedGameSet(address indexed game);

    constructor() Ownable(msg.sender) {}

    function setAuthorizedGame(address game) external onlyOwner {
        authorizedGame = game;
        emit AuthorizedGameSet(game);
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner() || msg.sender == authorizedGame, "Not authorized");
        _;
    }

    function initReputation(uint256 tokenId) external onlyAuthorized {
        require(!reputations[tokenId].exists, "Already initialized");
        reputations[tokenId] = Reputation(0, 0, 1000, true); // start with 1000 elo
        emit ReputationInitialized(tokenId);
    }

    function recordWin(uint256 tokenId) external onlyAuthorized {
        require(reputations[tokenId].exists, "Not initialized");
        reputations[tokenId].wins++;
        reputations[tokenId].score += 25;
        emit ReputationUpdated(
            tokenId,
            reputations[tokenId].wins,
            reputations[tokenId].losses,
            reputations[tokenId].score
        );
    }

    function recordLoss(uint256 tokenId) external onlyAuthorized {
        require(reputations[tokenId].exists, "Not initialized");
        reputations[tokenId].losses++;
        uint256 penalty = reputations[tokenId].score > 15 ? 15 : reputations[tokenId].score;
        reputations[tokenId].score -= penalty;
        emit ReputationUpdated(
            tokenId,
            reputations[tokenId].wins,
            reputations[tokenId].losses,
            reputations[tokenId].score
        );
    }

    function getReputation(uint256 tokenId) external view returns (uint256 wins, uint256 losses, uint256 score) {
        require(reputations[tokenId].exists, "Not initialized");
        Reputation storage r = reputations[tokenId];
        return (r.wins, r.losses, r.score);
    }
}
