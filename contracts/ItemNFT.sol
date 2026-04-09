// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ItemNFT – ERC-721 loot/item NFT for Agent Arena
contract ItemNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    struct Item {
        string name;
        uint256 power;
        uint8 rarity; // 0 = common, 1 = uncommon, 2 = rare, 3 = epic, 4 = legendary
    }

    mapping(uint256 => Item) public items;
    mapping(address => bool) public authorizedMinters;

    event ItemMinted(uint256 indexed tokenId, address indexed to, string name, uint256 power, uint8 rarity);
    event MinterAuthorized(address indexed minter, bool status);

    constructor() ERC721("AgentArena Item", "ITEM") Ownable(msg.sender) {}

    function setAuthorizedMinter(address minter, bool status) external onlyOwner {
        authorizedMinters[minter] = status;
        emit MinterAuthorized(minter, status);
    }

    function mint(address to, string calldata name, uint256 power, uint8 rarity) external returns (uint256) {
        require(msg.sender == owner() || authorizedMinters[msg.sender], "Not authorized to mint");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        items[tokenId] = Item(name, power, rarity);
        emit ItemMinted(tokenId, to, name, power, rarity);
        return tokenId;
    }

    function getItem(uint256 tokenId) external view returns (string memory name, uint256 power, uint8 rarity) {
        require(ownerOf(tokenId) != address(0), "Item does not exist");
        Item storage i = items[tokenId];
        return (i.name, i.power, i.rarity);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
