// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IkWhToken {
    function priceForSwap(address tokenToPay) external view returns (uint256);
    function burnFrom(address account, uint256 amount) external;
    function burn(uint256 amount) external;
    function convertKWh(address tokenToPay, uint256 amountPayment) external returns (uint256);


}