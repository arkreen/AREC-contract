// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract NFTTester {
    address private FeswapNFT;
    address private token0;
    address private token1;

    // 0x84e924C5E04438D2c1Df1A981f7E7104952e6de1 
    // 0xD756fb6A081CC11e7F513C39399DB296b1DE3036 
    // 0xFf807885934003A35b1284d7445fc83Fd23417e5

    event NFTTokenID(uint);
    
    constructor() payable {
    }

    receive() external payable {
//       FeswapNFT   = address(0x84e924C5E04438D2c1Df1A981f7E7104952e6de1);
//       token0      = address(0xD756fb6A081CC11e7F513C39399DB296b1DE3036);
//       token1      = address(0xFf807885934003A35b1284d7445fc83Fd23417e5);
//       (bool success, ) = FeswapNFT.call(abi.encodeWithSelector(0xB1259797, token0, token1, address(this)));
//       require(success, 'Contract Not Allowed');
    }

    function setTestAddress( address _FeswapNFT, address _token0, address _token1) public {
        FeswapNFT = _FeswapNFT;
        token0 = _token0;
        token1 = _token1;
    }

    function callNFTBidding() public {
        // IFeswaNFT(FeswapNFT).BidFeswaPair(token0, token1, address(this));
        // bytes4(keccak256(bytes('BidFeswaPair(address,address,address)'))):  0xB1259797;
        (bool success, bytes memory returnData) = FeswapNFT.call(abi.encodeWithSelector(0xB1259797, token0, token1, address(this)));
        require(success, 'Contract Not Allowed');
        emit NFTTokenID(abi.decode(returnData, (uint)));
    }
}
