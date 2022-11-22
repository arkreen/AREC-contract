// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../ArkreenMinerV10X.sol";

// For testing of contract upgrading 
contract ArkreenMinerV10XU is ArkreenMinerV10X
{
    struct MinerMore {
        string         attribute;
    }  

    mapping(uint256 => MinerMore) public AllMinerInfoMore;

    /// @dev Returns the current version of the smart contract
    function version() external pure returns (string memory) {
        return '1.0.1';
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://www.arkreen.com/miners/";
    }

    function updateMineMore(uint256 minerID, string calldata attribute) public onlyOwner {
        MinerMore memory tmpMinerMore;
        tmpMinerMore.attribute = attribute;
        AllMinerInfoMore[minerID] = tmpMinerMore;
    }

    function getMineMore(uint256 minerID) public view returns (string memory) {
        return AllMinerInfoMore[minerID].attribute;
    }
}
