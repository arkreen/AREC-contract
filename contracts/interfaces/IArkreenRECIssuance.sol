// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../ArkreenRECIssuanceType.sol";

interface IArkreenRECIssuance {
    function baseURI() external view returns (string memory);
    function getRECData(uint256 tokenId) external view returns (RECData memory);
}
