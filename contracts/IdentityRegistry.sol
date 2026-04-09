// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title IdentityRegistry – ERC-8004 inspired identity registry for agents
contract IdentityRegistry is Ownable {
    struct Identity {
        string name;
        string metadataURI;
        bool exists;
    }

    // agentTokenId => Identity
    mapping(uint256 => Identity) public identities;

    event IdentityRegistered(uint256 indexed tokenId, string name, string metadataURI);
    event IdentityUpdated(uint256 indexed tokenId, string name, string metadataURI);

    constructor() Ownable(msg.sender) {}

    function registerIdentity(uint256 tokenId, string calldata name, string calldata metadataURI) external onlyOwner {
        require(!identities[tokenId].exists, "Identity already registered");
        identities[tokenId] = Identity(name, metadataURI, true);
        emit IdentityRegistered(tokenId, name, metadataURI);
    }

    function updateIdentity(uint256 tokenId, string calldata name, string calldata metadataURI) external onlyOwner {
        require(identities[tokenId].exists, "Identity not registered");
        identities[tokenId].name = name;
        identities[tokenId].metadataURI = metadataURI;
        emit IdentityUpdated(tokenId, name, metadataURI);
    }

    function getIdentity(uint256 tokenId) external view returns (string memory name, string memory metadataURI) {
        require(identities[tokenId].exists, "Identity not registered");
        Identity storage id = identities[tokenId];
        return (id.name, id.metadataURI);
    }
}
