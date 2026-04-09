// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentNFT – ERC-721 character NFT for Agent Arena
contract AgentNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    struct Agent {
        string name;
        uint256 level;
    }

    mapping(uint256 => Agent) public agents;

    event AgentMinted(uint256 indexed tokenId, address indexed to, string name, uint256 level);

    constructor() ERC721("AgentArena Agent", "AGENT") Ownable(msg.sender) {}

    function mint(address to, string calldata name) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        agents[tokenId] = Agent(name, 1);
        emit AgentMinted(tokenId, to, name, 1);
        return tokenId;
    }

    function getAgent(uint256 tokenId) external view returns (string memory name, uint256 level) {
        require(ownerOf(tokenId) != address(0), "Agent does not exist");
        Agent storage a = agents[tokenId];
        return (a.name, a.level);
    }

    function setLevel(uint256 tokenId, uint256 newLevel) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "Agent does not exist");
        agents[tokenId].level = newLevel;
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
