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
import "./interfaces/IArkreenRECToken.sol";
import './GreenBTCType.sol';
import "./interfaces/IERC20.sol";

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

    OpenInfo[] internal openingBoxList;             // Box in this list could be opened internally with just a trigger command 
    OpenInfo[] internal overtimeBoxList;            // Box in this list need to be revealed with external hash information

    mapping (uint256 => GreenBTCInfo)  public dataGBTC;
    mapping (uint256 => NFTStatus)  public dataNFT;
    mapping(address => bool) public whiteARTList;   // ART token -> true/false

    uint256 public luckyRate;  

    uint256 internal openingBoxListOffset;

    uint256 public overtimeRevealCap;
    uint256 public normalRevealCap;
    uint256 public removeRevealCap;

    event GreenBitCoin(uint256 height, uint256 ARTCount, address minter, uint8 greenType);
    event OpenBox(address opener, uint256 tokenID, uint256 blockNumber);

    event RevealBoxes(uint256[] revealList, bool[] wonList);

    modifier ensure(uint256 deadline) {
        require(uint32(deadline) >= block.timestamp, 'GBTC: EXPIRED');
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
     * @param deadline LB0-LB3: The deadline to cancel the transaction, LB7: 0x80, Open box at same time,
     * gbtc.miner must be the caller if opening box at the same time 
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

        // bit0 = 1: exact payment amount; bit1 = 1: ArkreenBank is used to get CART token; bit2 = 0: Repay to caller  
        uint256 modeAction = 0x03;                      
        
        // actionBuilderBadge(address,address,uint256,uint256,uint256,uint256,(address,string,string,string)): 0x8D7FCEFD  
        bytes memory builderCallData = abi.encodeWithSelector( 0x8D7FCEFD, tokenNative, tokenCART, msg.value,
                                            _getFullARTValue(gbtc.ARTCount), modeAction, uint32(deadline), badgeInfo);

        _callActionBuilderBadge(builderCallData, deadline, gbtc);                                 
    }

    function _getFullARTValue( uint256 actionValue ) internal view returns (uint256) {
        uint256 ratioFeeOffset = IArkreenRECToken(tokenCART).getRatioFeeOffset();
        return (actionValue * 10000) / (10000 - ratioFeeOffset);    // Add Offset fee
    }

    function _callActionBuilderBadge(
        bytes memory builderCallData, 
        uint256 deadline,
        GreenBTCInfo calldata gbtc
    ) internal {
        _actionBuilderBadge(abi.encodePacked(builderCallData, _msgSender()));       // Pay back to msg.sender already

        _mintNFT(gbtc);

        if((deadline >> 32) !=0) openBox(gbtc.height);
    }

    /** 
     * @dev Greenize BTC with the token/amount that the user has approved
     * @param gbtc Bitcoin block info to be greenized
     * @param sig Signature of the authority to Bitcoin block info
     * @param badgeInfo Information that will logged in Arkreen climate badge
     * @param payInfo Address and amount of the token that will be used to pay for offsetting ART
     * @param deadline LB0-LB3: The deadline to cancel the transaction, LB7: 0x80, Open box at same time,
     * gbtc.miner must be the caller if opening box at the same time 
     */
    function authMintGreenBTCWithApprove(
        GreenBTCInfo    calldata gbtc, 
        Sig             calldata sig, 
        BadgeInfo       calldata badgeInfo, 
        PayInfo         calldata payInfo,
        uint256                  deadline
    ) public ensure(deadline) {

        _checkGBTCData(gbtc, 0x00);
       
        _authVerify(gbtc, sig);                         // verify signature

        TransferHelper.safeTransferFrom(payInfo.token, msg.sender, address(this), payInfo.amount);

        // bit0 = 1: exact payment amount; bit1 = 1: ArkreenBank is used to get CART token; bit2 = 0: Repay to caller  
        uint256 modeAction = 0x03;            

        // actionBuilderBadge(address,address,uint256,uint256,uint256,uint256,(address,string,string,string)): 0x8D7FCEFD  
        bytes memory builderCallData = abi.encodeWithSelector( 0x8D7FCEFD, payInfo.token, tokenCART, payInfo.amount,
                                                        _getFullARTValue(gbtc.ARTCount), modeAction, uint32(deadline), badgeInfo);

        _callActionBuilderBadge(builderCallData, deadline, gbtc);
    }

    function _checkGBTCData(GreenBTCInfo calldata gbtc, uint8 typeTarget) view internal {
        require(dataGBTC[gbtc.height].ARTCount == 0, "GBTC: Already Minted");
        require((gbtc.greenType & 0xF0) == typeTarget, "GBTC: Wrong ART Type");
    }

    /** 
     * @dev Greenize BTC blocks in batch with the token/amount that the user has approved
     * @param gbtcList List of the Bitcoin block info to be greenized
     * @param sig Signature of the authority to Bitcoin block info
     * @param badgeInfo Information that will logged in Arkreen climate badge, all climate badges use the same info
     * @param payInfo Address and amount of the token that will be used to pay for offsetting ART of all the GreenBTC blocks
     * @param deadline LB0-LB3: The deadline to cancel the transaction, LB7: bit8, Open box at same time, bit7, skip if occupied 
     * gbtc.miner must be the caller if opening box at the same time 
     */
    function authMintGreenBTCWithApproveBatch(
        GreenBTCInfo[]  calldata  gbtcList, 
        Sig             calldata  sig, 
        BadgeInfo       calldata  badgeInfo, 
        PayInfo         calldata  payInfo,
        uint256                   deadline
    ) public ensure(deadline) {
      
        uint256 amountARTSum = _mintGreenBTCBatch(deadline, 0x00, gbtcList, sig);

        TransferHelper.safeTransferFrom(payInfo.token, msg.sender, address(this), payInfo.amount);
        uint256 ratioFeeOffset = IArkreenRECToken(tokenCART).getRatioFeeOffset();

        // modeAction = 0x02/0x06, bit0 = 0: exact ART amount; bit1 = 1: ArkreenBank is used to get CART token; bit2 = 0: Repay to caller
        uint256 modeAction = 0x02;

        // actionBuilderBadge(address,address,uint256,uint256,uint256,uint256,(address,string,string,string)): 0x8D7FCEFD
        bytes memory builderCallData = abi.encodeWithSelector( 0x8D7FCEFD, payInfo.token, tokenCART, payInfo.amount,
                                                  (amountARTSum * 10000) / (10000 - ratioFeeOffset),     // save memory buffer
                                                  modeAction, uint32(deadline), badgeInfo);

        _actionBuilderBadge(abi.encodePacked(builderCallData, _msgSender()));      // Pay back to msg.sender already

    }

    /** 
     * @dev Greenize BTC with specified ART token
     * @param gbtc Bitcoin block info to be greenized
     * @param sig Signature of the authority to Bitcoin block info
     * @param badgeInfo Information that will logged in Arkreen climate badge
     * @param tokenART Address of the ART token, which should be whitelisted in the accepted list.
     * @param deadline LB0-LB3: The deadline to cancel the transaction, LB7: 0x80, Open box at same time,
     * gbtc.miner must be the caller if opening box at the same time 
     */
    function authMintGreenBTCWithART(
        GreenBTCInfo    calldata gbtc, 
        Sig             calldata sig, 
        BadgeInfo       calldata badgeInfo,
        address                  tokenART, 
        uint256                  deadline
    ) public ensure(deadline) {

        _checkGBTCData(gbtc, 0x10);
        require(whiteARTList[tokenART], "GBTC: ART Not Accepted"); 

        _authVerify(gbtc, sig);                                                   // verify signature

        uint256 ratioFeeOffset = IArkreenRECToken(tokenART).getRatioFeeOffset();
        uint256 amountART = (gbtc.ARTCount * 10000) / (10000 - ratioFeeOffset);    // Add Offset fee
        TransferHelper.safeTransferFrom(tokenART, msg.sender, address(this), amountART);

        // actionBuilderBadgeWithART(address,uint256,uint256,(address,string,string,string)): 0x6E556DF8
        bytes memory builderCallData = abi.encodeWithSelector(0x6E556DF8, tokenART, amountART, uint32(deadline), badgeInfo);

        _callActionBuilderBadge(builderCallData, deadline, gbtc);          
    }

    /** 
     * @dev Greenize multiple BTC blocks with specified ART token
     * @param gbtcList Information of the Bitcoin blocks to be greenized
     * @param sig Signature of the authority to Bitcoin block info
     * @param badgeInfo Information that will logged in Arkreen climate badge, used for all the blocks
     * @param tokenART Address of the ART token, which should be whitelisted in the accepted list.
     * @param deadline The deadline to cancel the transaction
     * @param deadline LB0-LB3: The deadline to cancel the transaction, LB7: bit8, Open box at same time, bit7, skip if occupied 
     * gbtc.miner must be the caller if opening box at the same time     
     */
    function authMintGreenBTCWithARTBatch(
        GreenBTCInfo[]  calldata gbtcList, 
        Sig             calldata sig, 
        BadgeInfo       calldata badgeInfo,
        address                  tokenART, 
        uint256                  deadline
    )  public  ensure(deadline) {

        require(whiteARTList[tokenART], "GBTC: ART Not Accepted"); 

        uint256 amountARTSum = _mintGreenBTCBatch(deadline, 0x10, gbtcList, sig);
            
        uint256 ratioFeeOffset = IArkreenRECToken(tokenART).getRatioFeeOffset();
        uint256 amountART = ( amountARTSum *10000 ) / ( 10000 - ratioFeeOffset);
        TransferHelper.safeTransferFrom(tokenART, msg.sender, address(this), amountART);

        // actionBuilderBadgeWithART(address,uint256,uint256,(address,string,string,string)): 0x6E556DF8
        bytes memory builderCallData = abi.encodeWithSelector(0x6E556DF8, tokenART, amountART, uint32(deadline), badgeInfo);
        _actionBuilderBadge(abi.encodePacked(builderCallData, _msgSender()));
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
    function revealBoxes() public {

        uint256 openingListLength = openingBoxList.length;
        require (openingListLength != 0, 'GBTC: Empty List');

        uint256 revealcap = normalRevealCap;
        uint256 overtimeCap = overtimeRevealCap;
        uint256 removeCap = removeRevealCap;

        uint256[] memory revealList = new uint256[](revealcap);       // reveal 200 blocks once a time
        bool[] memory wonList = new bool[](revealcap);

        uint256 revealCount;
        uint256 skipCount;
        uint256 allRevealCount;

        for (uint256 index = openingBoxListOffset; index < openingListLength; index++) {
            OpenInfo memory openInfo = openingBoxList[index];
            uint256 tokenID = openInfo.tokenID;
            uint256 openHeight = openInfo.openHeight + 1;               // Hash of the next block determining the result

            if (block.number <= openHeight) {
                skipCount++;
            } else if ( block.number <= openHeight + 256 ) {
                address owner = dataNFT[tokenID].opener;
                uint256 random = uint256(keccak256(abi.encodePacked(tokenID, owner, blockhash(openHeight))));

                if ((random % 100) < luckyRate) { 
                  dataNFT[tokenID].won = true;
                  wonList[revealCount] = true;
                }

                dataNFT[tokenID].reveal = true;
                dataNFT[tokenID].seed = random;

                revealList[revealCount] = tokenID;                    // Prepare for return data 

                delete openingBoxList[index];
                allRevealCount++;

                revealCount++;
                if(revealCount == revealcap) break;
            } else {
                overtimeBoxList.push(openInfo);
                dataNFT[tokenID].seed = overtimeBoxList.length - 1;     // Save index to make it easy to reveal with hash value

                delete openingBoxList[index];
                allRevealCount++;
                if(allRevealCount == overtimeCap) break;
            } 
        }
 
        openingBoxListOffset += allRevealCount;

        if ((skipCount == 0) && (openingBoxListOffset == openingListLength)) {
            uint256 popLength = openingListLength;
            if (popLength > removeCap) popLength = removeCap;

            for (uint256 index = 0; index < popLength; index++) {
                openingBoxList.pop();
            }

            if (openingBoxListOffset > openingBoxList.length) {
                openingBoxListOffset = openingBoxList.length;
            }
        }

        // Set the final reveal length if necessary
        if (revealCount < revealcap) {
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

        uint256[] memory revealList = new uint256[](lengthReveal);
        bool[] memory wonList = new bool[](lengthReveal);

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

        emit RevealBoxes(revealList, wonList);
    }

    /**
     * @dev Set new caps
     */
    function setNewCaps(uint256 newNormalCap, uint256 newOvertimeCap, uint256 newRemoveCap) public {
        if( newNormalCap != 0) normalRevealCap = newNormalCap;
        if( newOvertimeCap != 0) overtimeRevealCap = newOvertimeCap;
        if( newRemoveCap != 0) removeRevealCap = newRemoveCap;
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
     * @dev Return the number of the opened box in the opening list to be opened.
     * If the return value is non-zero, need to call revealBoxes repeatly 
     */
    function getOpeningOvertimed() public view returns (uint256) {
        return openingBoxListOffset;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenID) public view override returns (string memory){

        require(dataGBTC[tokenID].minter != address(0), "GBTC: Not Minted");
        return IGreenBTCImage(greenBtcImage).getCertificateSVG(ownerOf(tokenID), dataGBTC[tokenID], dataNFT[tokenID]);
    }

    /**
     * @dev Return if the specified token is sold, opened and revealed
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
        emit GreenBitCoin(gbtc.height, gbtc.ARTCount, gbtc.minter, gbtc.greenType);
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
     * @dev Verify the signature of authority based on the GreenBTC info list, and mint the BTC block list
     * @param option the option to mint GreeenBTC block, if Open simultaneouly, if skip while occupied 
     * @param typeTarget Type of the ART token; = 0x00, cART; = 0x01, ART token
     * @param gbtcList List of the Bitcoin block info to be minted
     * @param sig Signature of the authority
     */
    function _mintGreenBTCBatch(
        uint256 option,
        uint8 typeTarget,
        GreenBTCInfo[] calldata gbtcList,
        Sig calldata sig
    ) internal returns(uint256 amountARTSum) {

        bytes memory greenBTCData = abi.encode(GREENBTC_BATCH_TYPEHASH, gbtcList);
        bytes32 greenBTCHash = keccak256(greenBTCData);
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR, greenBTCHash));
        address recoveredAddress = ecrecover(digest, sig.v, sig.r, sig.s);

        require(recoveredAddress == authorizer, "GBTC: Invalid Singature");

        bool ifOpen = (option & (1<<63)) != 0;
        bool ifSkip = (option & (1<<62)) != 0;

        for(uint256 index = 0; index < gbtcList.length; index++) {
            GreenBTCInfo calldata gbtc = gbtcList[index];

            // skip if occupied in skipping option 
            if(ifSkip && (dataGBTC[gbtc.height].ARTCount != 0)) continue;

            _checkGBTCData(gbtc, typeTarget);
            _mintNFT(gbtc);

            if(ifOpen) openBox(gbtc.height);

            amountARTSum += gbtcList[index].ARTCount;
        }
        require(amountARTSum != 0, "GBTC: No Block Available");

    }


    /**
     * @dev Add or remove the acceptable ART tokens
     * @param tokenARTList ART list to add or rmeove
     * @param addOrRemove = 0, to remove; = 1, to add
     */
    function mangeARTTokens(address[] calldata tokenARTList, bool addOrRemove) external onlyOwner {
        for(uint256 i = 0; i < tokenARTList.length; i++) {
            address tokenART = tokenARTList[i];

            require(tokenART != address(0) && whiteARTList[tokenART] != addOrRemove, "GBTC: Wrong ART Status");
            whiteARTList[tokenART] = addOrRemove;
        }
    }   

    /**
     * @dev Call arkreenBuilder with the specified calldata
     * @param builderCallData Call data passed to arkreenBuilder
     */
    function _actionBuilderBadge(bytes memory builderCallData) internal {
        (bool success, bytes memory returndata) = arkreenBuilder.call(builderCallData);

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
