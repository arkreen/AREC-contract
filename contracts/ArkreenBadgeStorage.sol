// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ArkreenBadgeType.sol";  

abstract contract ArkreenBadgeStorage {
    string public baseURI;
    uint256 public minOffsetAmount;

    address public arkreenRegistry;                // contracts storing all miner's ownership        

    /// @dev Counter of total offset action, also the id tracks the offset action
    uint256 public offsetCounter;

    /// @dev Total redeemed REC amount
    uint256 public totalRedeemed;

    /// @dev Total offset AREC amount registered in offset actions
    uint256 public totalOffsetRegistered;

    /// @dev Total offset AREC amount retired in AREC retiremment certificateion
    uint256 public totalOffsetRetired;    
      
    /// @dev mapping from offsetCounter to OffsetAction data
    mapping(uint256 => OffsetAction) public offsetActions;

    /// @dev List all the offset action ids belonging to user
    mapping(address => uint256[]) public userActions;

    mapping(uint256 => OffsetRecord) public certificates;       // Retirement Badges

    uint256 public partialARECID;                        // AREC NFT ID partialy offset
    uint256 public partialAvailableAmount;               // Amount available for partial offset

    uint256 public detailsCounter;
    mapping(uint256 => OffsetDetail[]) public OffsetDetails;


}