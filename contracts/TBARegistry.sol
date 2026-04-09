// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./TokenBoundAccount.sol";

/// @title TBARegistry – Factory and registry for token-bound accounts (ERC-6551 style)
contract TBARegistry {
    address public immutable implementation;

    mapping(bytes32 => address) public accounts;

    event AccountCreated(address indexed account, address indexed tokenContract, uint256 indexed tokenId);

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createAccount(address tokenContract, uint256 tokenId) external returns (address) {
        bytes32 key = _key(tokenContract, tokenId);
        require(accounts[key] == address(0), "Account already exists");

        // Deploy a minimal clone using CREATE2
        bytes32 salt = keccak256(abi.encodePacked(block.chainid, tokenContract, tokenId));
        TokenBoundAccount account = new TokenBoundAccount{salt: salt}();
        account.initialize(block.chainid, tokenContract, tokenId);

        accounts[key] = address(account);
        emit AccountCreated(address(account), tokenContract, tokenId);
        return address(account);
    }

    function getAccount(address tokenContract, uint256 tokenId) external view returns (address) {
        return accounts[_key(tokenContract, tokenId)];
    }

    function _key(address tokenContract, uint256 tokenId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenContract, tokenId));
    }
}
