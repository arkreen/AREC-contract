// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '../GreenBTCType.sol';

interface IGreenBTCImage {
    function getCertificateSVGBytes(address owner, GreenBTCInfo calldata gbtc) external pure returns(string memory);
    function getGreenTreeSVGBytes() external pure returns(string memory);
    function getBlindBoxSVGBytes(uint256 num) external pure returns(string memory);

}
