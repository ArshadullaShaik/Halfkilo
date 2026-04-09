// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PetNFT – ERC-721 pet NFT with mood and personality
contract PetNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    struct Pet {
        string name;
        uint8 mood;        // 0 = neutral, 1 = happy, 2 = angry, 3 = sad, 4 = excited
        uint8 personality; // 0 = calm, 1 = aggressive, 2 = playful, 3 = shy
    }

    mapping(uint256 => Pet) public pets;
    mapping(address => bool) public authorizedUpdaters;

    event PetMinted(uint256 indexed tokenId, address indexed to, string name);
    event MoodUpdated(uint256 indexed tokenId, uint8 newMood);
    event UpdaterAuthorized(address indexed updater, bool status);

    constructor() ERC721("AgentArena Pet", "PET") Ownable(msg.sender) {}

    function setAuthorizedUpdater(address updater, bool status) external onlyOwner {
        authorizedUpdaters[updater] = status;
        emit UpdaterAuthorized(updater, status);
    }

    function mint(address to, string calldata name, uint8 personality) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        pets[tokenId] = Pet(name, 0, personality);
        emit PetMinted(tokenId, to, name);
        return tokenId;
    }

    function updateMood(uint256 tokenId, uint8 newMood) external {
        require(
            msg.sender == owner() || authorizedUpdaters[msg.sender],
            "Not authorized to update mood"
        );
        require(ownerOf(tokenId) != address(0), "Pet does not exist");
        pets[tokenId].mood = newMood;
        emit MoodUpdated(tokenId, newMood);
    }

    function getPet(uint256 tokenId) external view returns (string memory name, uint8 mood, uint8 personality) {
        require(ownerOf(tokenId) != address(0), "Pet does not exist");
        Pet storage p = pets[tokenId];
        return (p.name, p.mood, p.personality);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
