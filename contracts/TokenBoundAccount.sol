// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title TokenBoundAccount – ERC-6551 style smart contract wallet owned by an NFT
contract TokenBoundAccount is IERC165, IERC721Receiver {
    uint256 public chainId;
    address public tokenContract;
    uint256 public tokenId;
    bool private _initialized;

    event Executed(address indexed target, uint256 value, bytes data, bool success);

    modifier onlyOwner() {
        require(msg.sender == owner(), "Not token owner");
        _;
    }

    function initialize(uint256 _chainId, address _tokenContract, uint256 _tokenId) external {
        require(!_initialized, "Already initialized");
        chainId = _chainId;
        tokenContract = _tokenContract;
        tokenId = _tokenId;
        _initialized = true;
    }

    function owner() public view returns (address) {
        if (!_initialized) return address(0);
        return IERC721(tokenContract).ownerOf(tokenId);
    }

    function execute(address target, uint256 value, bytes calldata data) external payable onlyOwner returns (bytes memory) {
        (bool success, bytes memory result) = target.call{value: value}(data);
        emit Executed(target, value, data, success);
        require(success, "Execution failed");
        return result;
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC165).interfaceId ||
               interfaceId == type(IERC721Receiver).interfaceId;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}
