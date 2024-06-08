// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import "../libraries/TransferHelper.sol";

// Import this file to use console.log
import "hardhat/console.sol";

contract GreenBTCGift is 
    ContextUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC1155Upgradeable
{

    address public greenBTC;
    address public tokenAKRE;

    address public tokenLockAge;

    // tokenAddress: MSB0: 20, the address of the token to be sent to user while the gift card is returned back and burned
    // Amount1: MSB24:4, the amount of the Lockage token to be burned while claming. Let (MSB24:3) = a, (MSB27）= b, Amount1 = a * (10**b)
    // Amount0: MSB28:4, the amount to send. Let (MSB28:3) = n, (MSB31）= m, Amount0 = n * (10**m)
    mapping (uint256 => bytes32) public greenBTCGifts;     

    event GiftBatchMinted(address indexed greener, uint256[] giftIDs, uint256[] amounts);
    event GiftBatchClaimed(address indexed user, uint256[] giftIDs, uint256[] amounts);
    event GiftClaimed(address indexed user, uint256 giftID, uint256 amount);
    event DomainRegistered(uint256 domainID, bytes32 domainInfo);
    event DomainGreenized(address gbtcActor, uint256 actionNumber, uint256 blockHeight, uint256 domainID, uint256 boxStart, uint256 boxNumber);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //initialize
    //function initialize(address authority, address builder, address cART, address native)
    function initialize(address gbtc, address akre)
        external
        virtual
        initializer
    {
        __UUPSUpgradeable_init();
        __Ownable_init_unchained();
        __ERC1155_init_unchained("");
        greenBTC = gbtc;
        tokenAKRE = akre;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function initGift(uint256 giftId, bytes32 giftInfo) public onlyOwner {

        //console.log("GGGGGGGGGGGGGGGGGGGGGGG", giftId);
        //console.logBytes32(giftInfo);
        //console.logBytes32(greenBTCGifts[giftId]);

        require (uint256(giftInfo) != 0, "GBTC: Wrong Gift Info");
        require (uint256(greenBTCGifts[giftId]) == 0, "GBTC: Gift Repteated");
        greenBTCGifts[giftId] = giftInfo;
    }


    function mintGifts(address greener, uint256[] memory giftIDs, uint256[] memory amounts) public {
        require (msg.sender == greenBTC, "GBTC: Wrong Caller");
        require (giftIDs.length == amounts.length, "GBTC: Wrong Length");

        uint256 amountAKRE = 0;
        address akre = tokenAKRE;
        uint8 akreAmountDecimal = 0;
        for (uint256 index; index < giftIDs.length; index++) {
            uint256 giftInfo = uint256(greenBTCGifts[giftIDs[index]]);
            //console.log("XXXXXXXXXX", giftIDs[index], giftInfo);
            require (giftInfo != 0, "GBTC: Wrong Gift ID");

            address giftToken = address(uint160(giftInfo >> 96));
            if ((giftToken == akre) || giftToken == address(0)) {
                amountAKRE += uint256(uint32(giftInfo) >> 8) * amounts[index];
                if (akreAmountDecimal == 0) {
                    akreAmountDecimal = uint8(giftInfo);
                }
            } else {
                 uint256 amountToken = uint256(uint32(giftInfo) >> 8) * amounts[index] * getDecimalPower(uint8(giftInfo));
                TransferHelper.safeTransferFrom(giftToken, msg.sender, address(this), amountToken);
            }
        }

        if (amountAKRE != 0) {
            TransferHelper.safeTransferFrom(akre, msg.sender, address(this), amountAKRE * getDecimalPower(akreAmountDecimal));
        }
        _mintBatch(greener, giftIDs, amounts, '');

        emit GiftBatchMinted(greener, giftIDs, amounts);
    }

    function claimGift(uint256 giftID, uint256 amount) public {
        uint256 giftInfo = uint256(greenBTCGifts[giftID]);
        require ( giftInfo != 0, "GBTC: Wrong Gift ID");

        _burn(msg.sender, giftID, amount);

        address giftToken = address(uint160(giftInfo >> 96));
        uint256 amountToken = amount * (uint24(giftInfo >> 8)) * getDecimalPower(uint8(giftInfo));

        emit GiftClaimed(msg.sender, giftID, amount);

        TransferHelper.safeTransfer(giftToken, msg.sender, amountToken);
    }

    function claimMultiGifts(uint256[] memory giftIDs, uint256[] memory amounts) public {

        require (giftIDs.length == amounts.length, "GBTC: Wrong Length");
        _burnBatch(msg.sender, giftIDs, amounts);

        uint32 amountAKRE = 0;
        address akre = tokenAKRE;
        uint8 akreAmountDecimal = 0;
        for (uint256 index; index < giftIDs.length; index++) {
            uint256 giftInfo = uint256(greenBTCGifts[giftIDs[index]]);
            require ( giftInfo != 0, "GBTC: Wrong Gift ID");

            address giftToken = address(uint160(giftInfo >> 96));
            if ((giftToken == akre) || giftToken == address(0)) {
                amountAKRE += (uint32(giftInfo) >> 8);
                if (akreAmountDecimal == 0) {
                    akreAmountDecimal = uint8(giftInfo);
                }
            } else {
                 uint256 amountToken = uint256(uint32(giftInfo) >> 8) * getDecimalPower(uint8(giftInfo));
                TransferHelper.safeTransferFrom(giftToken, address(this), msg.sender, amountToken);
            }
        }

        if (amountAKRE != 0) {
            TransferHelper.safeTransferFrom(akre, address(this), msg.sender, amountAKRE * getDecimalPower(akreAmountDecimal));
        }

        emit GiftBatchClaimed(msg.sender, giftIDs, amounts);
    }


    function testDecimalPower() public {
        uint256 gasBefore = gasleft();
        uint256 result = getDecimalPower(19);
        uint256 gasAfter = gasleft();

        address akre = tokenAKRE;

        uint256 gasAfter2 = gasleft();

        console.log('PPPPPPPPPPPPP', gasBefore, gasAfter, gasAfter2);

        gasAfter2 = gasleft();

        //address akre1 = tokenAKRE;
        //result = uint256(greenBTCGifts[0x123]);
        uint8[] memory buffer = new uint8[](200);
        uint256 gasAfter3 = gasleft();

        console.log('QQQQQQQQQ', akre, gasAfter2, gasAfter3);
        console.log('RRRRRRRRRR', result, buffer[0], gasAfter3);

        tokenAKRE = akre;
    }


    /**
     * @dev get the given power of ten, gas usage is less than fetching from storage. 
     * @param power the power of ten
     */
    function getDecimalPower(uint8 power) internal pure returns (uint256) {
        power = power % 20;     // max is 10**19
        uint256 result = 1;
        uint256 exp = 10;
        while (power > 0) {
          if ((power & 0x01) !=0) result = result * exp;
          exp = exp * exp;
          power >>= 1;
        }
        return result;
    }
}
