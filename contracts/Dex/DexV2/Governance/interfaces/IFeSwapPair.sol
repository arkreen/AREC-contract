// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './IFeSwapERC20.sol';

interface IFeSwapPair {
    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount1Out, address indexed to );
    event Sync(uint112 reserve0, uint112 reserve1);

    function MINIMUM_LIQUIDITY() external pure returns (uint);
    function factory() external view returns (address);
    function pairOwner() external view returns (address);
    function tokenIn() external view returns (address);
    function tokenOut() external view returns (address);
    function getReserves() external view returns ( uint112 _reserveIn, uint112 _reserveOut, 
                                                          uint32 _blockTimestampLast, uint _rateTriggerArbitrage);
    function price0CumulativeLast() external view returns (uint);
    function price1CumulativeLast() external view returns (uint);
    function kLast() external view returns (uint);
    function rateTriggerArbitrage() external view returns (uint);
    
    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint amount0, uint amount1);
    function swap(uint amountOut, address to, bytes calldata data) external;
    function skim(address to) external;
    function sync() external;

    function initialize(address, address, address, address, uint) external;
    function setOwner(address _pairOwner) external;
    function adjusArbitragetRate(uint newRate) external;
}
