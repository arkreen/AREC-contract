// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

import "./libraries/FormattedStrings.sol";
import "./libraries/TransferHelper.sol";

import "./interfaces/IWETH.sol";
import './interfaces/IGreenBTCImage.sol';
import './interfaces/IArkreenBuilder.sol';
import './interfaces/IArkreenRECBank.sol';
import './GreenBTCType.sol';

// Import this file to use console.log
// import "hardhat/console.sol";

contract GreenBTC is 
    ContextUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC721EnumerableUpgradeable
{

    using Strings for uint256;
    using Strings for address;
    using FormattedStrings for uint256;

    //keccak256("GreenBitCoin(uint256 height,string energyStr,uint256 artCount,string blockTime,address minter,uint8 greenType)");
    bytes32 constant GREEN_BTC_TYPEHASH = 0xE645798FE54DB29ED50FD7F01A05DE6D1C5A65FAC8902DCFD7427B30FBD87C24;

    //keccak256("GreenBitCoinBatch((uint128,uint128,address,uint8,string,string)[])");
    bytes32 constant GREENBTC_BATCH_TYPEHASH = 0x829ABF7A83FCBCF66649914B5A9A514ACBF6BEDA598A620AEF732202E8155D73;
    
    string  constant NAME = "Green BTC Club";
    string  constant SYMBOL = "GBC";
    string  constant VERSION = "1";

    bytes32 public  DOMAIN_SEPARATOR;

    address public manager;
    address public authorizer;

    address public greenBtcImage;
    address public arkreenBuilder;
    address public tokenCART;                       // CART token is bought to greenize Bitcoin by default while some other token is paid.
    address public tokenNative;              

    OpenInfo[] internal openingBoxList;             // Box in this list could be openned internally with just a trigger command 
    OpenInfo[] internal overtimeBoxList;            // Box in this list need to be revealed with external hash information

    mapping (uint256 => GreenBTCInfo)  public dataGBTC;
    mapping (uint256 => NFTStatus)  public dataNFT;
    mapping(address => bool) public whiteARTList;   // ART token -> true/false

    uint256 public luckyRate;  

    event GreenBitCoin(uint256 height, uint256 ARTCount, address minter, uint8 greenType);
    event OpenBox(address openner, uint256 tokenID, uint256 blockNumber);

    event RevealBoxes(uint256[] revealList, bool[] wonList);

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, 'GBTC: EXPIRED');
        _;
    }

    modifier onlyManager(){
        require(msg.sender == manager, 'GBTC: Not Manager');
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //initialize
    function initialize(address authority, address builder, address cART, address native)
        external
        virtual
        initializer
    {
        __UUPSUpgradeable_init();
        __Ownable_init_unchained();
        __ERC721_init_unchained(NAME, SYMBOL);

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );  

        manager         = owner();
        authorizer      = authority;
        arkreenBuilder  = builder;
        tokenCART       = cART;
        tokenNative     = native;
        luckyRate       = 5;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function setManager(address newManager) public onlyOwner{
        require(newManager != address(0), "GBTC: Zero Address"); 
        manager = newManager;
    }

    function setAuthorizer(address newAuthAddress) public onlyOwner {
        require(newAuthAddress != address(0), "GBTC: Zero Address"); 
        authorizer = newAuthAddress;
    }

    function setImageContract(address newImageContract) public onlyOwner {
        require(newImageContract != address(0), 'GBTC: Zero Address');
        greenBtcImage = newImageContract;
    }

    function setCARTContract(address newCARTToken) public onlyOwner {
        require(newCARTToken != address(0), 'GBTC: Zero Address');
        tokenCART = newCARTToken;
    }

    function setLuckyRate(uint256 newRate) public onlyOwner {
        require(newRate <= 20, 'GBTC: Too More');
        luckyRate = newRate;
    }

    /**
     * @dev Approve the tokens which can be transferred from this GreenBTC contract by arkreenBuilder
     * @param tokens The token list
     */
    function approveBuilder(address[] calldata tokens) public onlyOwner {
        require(arkreenBuilder != address(0), "GBTC: No Builder");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], arkreenBuilder, type(uint256).max);
        }
    }

    /** 
     * @dev Greenize BTC with the native token
     * @param gbtc Bitcoin block info to be greenized
     * @param sig Signature of the authority to Bitcoin block info
     * @param badgeInfo Information that will logged in Arkreen climate badge
     * @param deadline The deadline to cancel the transaction
     */
    function authMintGreenBTCWithNative(
        GreenBTCInfo    calldata gbtc,
        Sig             calldata sig,
        BadgeInfo       calldata badgeInfo,
        uint256                  deadline
    ) public payable ensure(deadline) {

        require(dataGBTC[gbtc.height].ARTCount == 0, "GBTC: Already Minted");
        
        _authVerify(gbtc, sig);                         //verify signature

        IWETH(tokenNative).deposit{value: msg.value}(); // Wrap MATIC to WMATIC 

        uint256 modeAction = 0x03;                      // bit0 = 1: exact payment amount; bit1 = 1: ArkreenBank is used to get CART token

        // actionBuilderBadge(address,address,uint256,uint256,uint256,uint256,(address,string,string,string)): 0x8D7FCEFD                                            
        bytes memory callData = abi.encodeWithSelector( 0x8D7FCEFD, tokenNative, tokenCART, msg.value,
                                                        gbtc.ARTCount, modeAction, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, gbtc.minter));     // Pay back to msg.sender already

        _mintNFT(gbtc);

        emit GreenBitCoin(gbtc.height, gbtc.ARTCount, gbtc.minter, gbtc.greenType);
    }

    /** 
     * @dev Greenize BTC with the token/amount that the user has approved
     * @param gbtc Bitcoin block info to be greenized
     * @param sig Signature of the authority to Bitcoin block info
     * @param badgeInfo Information that will logged in Arkreen climate badge
     * @param payInfo Address and amount of the token that will be used to pay for offsetting ART
     * @param deadline The deadline to cancel the transaction
     */
    function authMintGreenBTCWithApprove(
        GreenBTCInfo    calldata gbtc, 
        Sig             calldata sig, 
        BadgeInfo       calldata badgeInfo, 
        PayInfo         calldata payInfo,
        uint256                  deadline
    ) external ensure(deadline) {

        require(dataGBTC[gbtc.height].ARTCount == 0, "GBTC: Already Minted");
        require((gbtc.greenType & 0xF0) == 0x00, "GBTC: Wrong ART Type");
       
        _authVerify(gbtc, sig);                         // verify signature

        TransferHelper.safeTransferFrom(payInfo.token, msg.sender, address(this), payInfo.amount);

        uint256 modeAction = 0x03;                      // bit0 = 1: exact payment amount; bit1 = 1: ArkreenBank is used to get CART token

        // actionBuilderBadge(address,address,uint256,uint256,uint256,uint256,(address,string,string,string)): 0x8D7FCEFD                                            
        bytes memory callData = abi.encodeWithSelector( 0x8D7FCEFD, payInfo.token, tokenCART, payInfo.amount,
                                                        gbtc.ARTCount, modeAction, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, gbtc.minter));     // Pay back to msg.sender already ??

        _mintNFT(gbtc);

        emit GreenBitCoin(gbtc.height, gbtc.ARTCount, gbtc.minter, gbtc.greenType);
    }

    /** 
     * @dev Greenize BTC with specified ART token
     * @param gbtc Bitcoin block info to be greenized
     * @param sig Signature of the authority to Bitcoin block info
     * @param badgeInfo Information that will logged in Arkreen climate badge
     * @param tokenART Address of the ART token, which should be whitelisted in the accepted list.
     * @param deadline The deadline to cancel the transaction
     */
    function authMintGreenBTCWithART(
        GreenBTCInfo    calldata gbtc, 
        Sig             calldata sig, 
        BadgeInfo       calldata badgeInfo,
        address                  tokenART, 
        uint256                  deadline
    )  public  ensure(deadline) {

        require(dataGBTC[gbtc.height].ARTCount == 0, "GBTC: Already Minted");
        require(whiteARTList[tokenART], "GBTC: ART Not Accepted"); 
        require((gbtc.greenType & 0xF0) == 0x10, "GBTC: Wrong ART Type");

        _authVerify(gbtc, sig);                                                 // verify signature

        uint256  amountART = gbtc.ARTCount;
        TransferHelper.safeTransferFrom(tokenART, msg.sender, address(this), amountART);

        // actionBuilderBadgeWithART(address,uint256,uint256,(address,string,string,string)): 0x6E556DF8
        bytes memory callData = abi.encodeWithSelector(0x6E556DF8, tokenART, amountART, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, gbtc.minter));

        _mintNFT(gbtc);

        emit GreenBitCoin(gbtc.height, gbtc.ARTCount, gbtc.minter, gbtc.greenType);
    }

    /** 
     * @dev Greenize BTC with specified ART token
     * @param gbtcList Bitcoin block info to be greenized
     * @param sig Signature of the authority to Bitcoin block info
     * @param badgeInfo Information that will logged in Arkreen climate badge
     * @param tokenART Address of the ART token, which should be whitelisted in the accepted list.
     * @param deadline The deadline to cancel the transaction
     */
    function authMintGreenBTCWithARTBatch(
        GreenBTCInfo[]  calldata gbtcList, 
        Sig             calldata sig, 
        BadgeInfo       calldata badgeInfo,
        address                  tokenART, 
        uint256                  deadline
    )  public  ensure(deadline) {

        require(whiteARTList[tokenART], "GBTC: ART Not Accepted"); 

        uint256 amountARTSum = _authVerifyBatch(gbtcList, sig);                                              // verify signature
 
        TransferHelper.safeTransferFrom(tokenART, msg.sender, address(this), amountARTSum);

        for(uint256 index = 0; index < gbtcList.length; index++) {
            require(dataGBTC[gbtcList[index].height].ARTCount == 0, "GBTC: Already Minted");
            require((gbtcList[index].greenType & 0xF0) == 0x10, "GBTC: Wrong ART Type");

            // actionBuilderBadgeWithART(address,uint256,uint256,(address,string,string,string)): 0x6E556DF8
            bytes memory callData = abi.encodeWithSelector(0x6E556DF8, tokenART, gbtcList[index].ARTCount, deadline, badgeInfo);

            _actionBuilderBadge(abi.encodePacked(callData, gbtcList[index].minter));

            _mintNFT(gbtcList[index]);

            emit GreenBitCoin(gbtcList[index].height, gbtcList[index].ARTCount, gbtcList[index].minter, gbtcList[index].greenType);
        }
    }

    /**
     * @dev Open the Green Bitcoin box, only thw owner of the box acceptable.
     * @param tokenID ID of the NFT token to be opened
     */
    function openBox(uint256 tokenID) public {
        require(msg.sender == ownerOf(tokenID), "GBTC: Not Owner");
        require(dataNFT[tokenID].open == false, "GBTC: Already Opened");

        OpenInfo memory openInfo = OpenInfo(uint64(tokenID), uint64(block.number));
        openingBoxList.push(openInfo);

        dataNFT[tokenID].open = true;
        dataNFT[tokenID].opener = msg.sender;

        emit OpenBox(msg.sender, tokenID, block.number);
    }

    /**
     * @dev Reveal all the opened boxes stored internally. All overtime boxes will be moved to another list. 
     * waiting for another revealing with hash value.
     */
    function revealBoxes() public onlyManager {

        uint256 openingListLength = openingBoxList.length;
        require (openingListLength != 0, 'GBTC: Empty List');

        uint256[] memory revealList = new uint256[](openingListLength);
        bool[] memory wonList = new bool[](openingListLength);
        OpenInfo[] memory skipList = new OpenInfo[](openingListLength);

        uint256 revealCount;
        uint256 skipCount;

        for (uint256 index = 0; index < openingListLength; index++) {
            OpenInfo memory openInfo = openingBoxList[index];
            uint256 tokenID = openInfo.tokenID;
            uint256 openHeight = openInfo.openHeight + 1;               // Hash of the next block determining the result

            if (block.number <= openHeight) {
                skipList[skipCount++] = openInfo;
            } else if ( block.number <= openHeight + 256 ) {
                address owner = dataNFT[tokenID].opener;
                uint256 random = uint256(keccak256(abi.encodePacked(tokenID, owner, blockhash(openHeight))));

                if ((random % 100) < luckyRate) { 
                  dataNFT[tokenID].won = true;
                  wonList[revealCount] = true;
                }

                dataNFT[tokenID].reveal = true;
                dataNFT[tokenID].seed = random;

                revealList[revealCount++] = tokenID;                    // Prepare for return data 

            } else {
                overtimeBoxList.push(openInfo);
                dataNFT[tokenID].seed = overtimeBoxList.length - 1;     // Save index to make it easy to reveal with hash value
            } 
        }

        delete openingBoxList;                                          // delete the while list

        for (uint256 index = 0; index < skipCount; index++) {           // Also works for empty skipList
            openingBoxList.push(skipList[index]);
        }

        // Set the final reveal length if necessary
        if (revealCount < openingListLength) {
          assembly {
              mstore(revealList, revealCount)
              mstore(wonList, revealCount)
          }
        }

        emit RevealBoxes(revealList, wonList);
    }

    /**
     * @dev Reveal the overtime boxes given in the input list.
     * @param tokenList All the token IDs of the NFT to be revealed.
     * @param hashList All the hash values of the block next after to block the NFT is minted.
     */
    function revealBoxesWithHash(uint256[] calldata tokenList, uint256[] calldata hashList) public onlyManager {

        uint256 lengthReveal = hashList.length; 
        require( tokenList.length == lengthReveal,  "GBTC: Wrong Length" );

        uint256 overtimeListLength = overtimeBoxList.length;
        require (overtimeListLength != 0, 'GBTC: Empty Overtime List');

        uint256[] memory revealList = new uint256[](overtimeListLength);
        bool[] memory wonList = new bool[](overtimeListLength);

        uint256 revealCount;
        for (uint256 index = 0; index < lengthReveal; index++) {

            uint256 tokenID = tokenList[index];

            // Can not repeat revealing, and can not reveal while not opened
            require(dataNFT[tokenID].open != dataNFT[tokenID].reveal, 'GBTC: Wrong Overtime Status' );  

            uint256 indexOvertime = dataNFT[tokenID].seed;          // seed is re-used to store the index in overtime list

            address owner = dataNFT[tokenID].opener;
            uint256 random = uint256(keccak256(abi.encodePacked(tokenID, owner, hashList[index])));

            if((random % 100) < luckyRate) {
                dataNFT[tokenID].won = true;
                wonList[revealCount] = true;
            }

            dataNFT[tokenID].reveal = true;
            dataNFT[tokenID].seed = random;

            // Remove the revealed item by replacing with the last item
            uint256 overtimeLast = overtimeBoxList.length - 1;
            if( indexOvertime < overtimeLast) {
                OpenInfo memory openInfo = overtimeBoxList[overtimeLast];
                overtimeBoxList[indexOvertime] = openInfo;
                dataNFT[openInfo.tokenID].seed = indexOvertime;
            }
            overtimeBoxList.pop();

            revealList[revealCount++] = tokenID;                            // Prepare for return data 
        }

        // Set the final reveal length
        assembly {
            mstore(revealList, revealCount)     
        }

        emit RevealBoxes(revealList, wonList);
    }

    /**
     * @dev Return all the boxes waiting for revealing.
     */
    function getOpeningBoxList() public view returns (OpenInfo[] memory) {
        return openingBoxList;
    }

    /**
     * @dev Return all the boxes waiting for revealing with hash value
     */
    function getOvertimeBoxList() public view returns (OpenInfo[] memory) {
        return overtimeBoxList;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenID) public view override returns (string memory){

        require(dataGBTC[tokenID].minter != address(0), "GBTC: Not Minted");
        return IGreenBTCImage(greenBtcImage).getCertificateSVG(ownerOf(tokenID), dataGBTC[tokenID], dataNFT[tokenID]);
    }

    /**
     * @dev Return if the specified token is sold, openned and revealed
     */
    function isUnPacking(uint256 tokenID) public view returns(bool, bool, bool) {

        if (dataGBTC[tokenID].ARTCount == 0) {
            return (false, false, false);
        } else{
            return (true, dataNFT[tokenID].open, dataNFT[tokenID].reveal);
        }
    }

    /**
     * @dev Mint the GreenBTC NFT based on the GreenBTC info
     * @param gbtc Green BTC information
     */
    function _mintNFT(GreenBTCInfo calldata gbtc) internal {

        require(gbtc.minter != address(0), 'GBTC: Zero Minter');

        dataGBTC[gbtc.height] = gbtc;

        NFTStatus memory nft;
        nft.blockHeight = uint64(gbtc.height);
        dataNFT[gbtc.height] = nft;

        _mint(gbtc.minter, gbtc.height);
    }

    /**
     * @dev Verify the signature of authority based on the GreenBTC info
     * @param gbtc Green BTC information
     * @param sig Signature of the authority
     */
    function _authVerify(GreenBTCInfo calldata gbtc, Sig calldata sig) internal view {

        bytes32 greenBTCHash = keccak256(abi.encode(GREEN_BTC_TYPEHASH, gbtc.height, gbtc.energyStr, gbtc.ARTCount, gbtc.blockTime, gbtc.minter, gbtc.greenType));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR, greenBTCHash));
        address recoveredAddress = ecrecover(digest, sig.v, sig.r, sig.s);

        require(recoveredAddress == authorizer, "GBTC: Invalid Singature");
    }

    /**
     * @dev Verify the signature of authority based on the GreenBTC info list
     * @param gbtcList Green BTC information of the List
     * @param sig Signature of the authority
     */
    function _authVerifyBatch(GreenBTCInfo[] calldata gbtcList, Sig calldata sig) internal view returns(uint256 amountARTSum) {

        bytes memory greenBTCData = abi.encode(GREENBTC_BATCH_TYPEHASH, gbtcList);

        for(uint256 index = 0; index < gbtcList.length; index++) amountARTSum += gbtcList[index].ARTCount;

        bytes32 greenBTCHash = keccak256(greenBTCData);
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR, greenBTCHash));
        address recoveredAddress = ecrecover(digest, sig.v, sig.r, sig.s);

        require(recoveredAddress == authorizer, "GBTC: Invalid Singature");
    }

    /**
     * @dev Add or remove the acceptable ART tokens
     * @param tokenARTList ART list to add or rmeove
     * @param addOrRemove = 0, to remove; = 1, to add
     */
    function mangeARTTokens(address[] calldata tokenARTList, bool addOrRemove) external onlyOwner {
        for(uint256 i = 0; i < tokenARTList.length; i++) {
            address tokenART = tokenARTList[i];

            require(tokenART != address(0) && whiteARTList[tokenART] != addOrRemove, "HSKESG: Wrong ART Status");
            whiteARTList[tokenART] = addOrRemove;
        }
    }   

    /**
     * @dev Call arkreenBuilder with the specified calldata
     * @param callData Call data passed to arkreenBuilder
     */
    function _actionBuilderBadge(bytes memory callData) internal {
        (bool success, bytes memory returndata) = arkreenBuilder.call(callData);

         if (!success) {
            if (returndata.length > 0) {
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("GBTC: Error Call to actionBuilderBadge");
            }
        }        
    }

    /**
     * @dev Get the price and sold amount of the specified ART versus the payment token 
     * @param tokenART ART token
     * @param tokenPay Payment token
     */
    function getPrice(address tokenART, address tokenPay) external view returns(uint128 price, uint128 received) {
        address artBank = IArkreenBuilder(arkreenBuilder).artBank();
        (price, received) = IArkreenRECBank(artBank).saleIncome(tokenART, tokenPay);
    }
}
