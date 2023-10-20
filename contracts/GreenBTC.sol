// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

import "./libraries/FormattedStrings.sol";
import "./libraries/TransferHelper.sol";

import './interfaces/IGreenBTCImage.sol';

// Import this file to use console.log
// import "hardhat/console.sol";

contract GreenBTC is 
    ContextUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC721Upgradeable
{

    using Strings for uint256;
    using Strings for address;
    using FormattedStrings for uint256;

    struct GreenBTCInfo{
        uint128 height;
        uint128 ARTCount;
        address beneficiary;
        uint8   greenType;
        string  blockTime;          // For NFT display
        string  energyStr;          // For NTT display
    }

    struct NFTStaus {
        address owner;
        uint64  blockHeight;
        bool    open;
        bool    reveal;
        bool    won;
        uint256 hash;
    }

    struct OpenInfo {
        uint64 tokenID;         // The token ID of the NFT opened
        uint64 openHeight;      // The height of the block opening the NFT
    }

    struct Sig {
        uint8       v;
        bytes32     r;
        bytes32     s;              
    }

    struct PayInfo {
        address token;
        uint256 amount;
    }

    struct BadgeInfo {
        address     beneficiary;
        string      offsetEntityID;
        string      beneficiaryID;
        string      offsetMessage;
    }

    //keccak256("GreenBitCoin(uint256 height,string energyStr,uint256 artCount,string blockTime,address beneficiary,uint8 greenType)");
    bytes32 constant _GREEN_BTC_TYPEHASH = 0x2cc287d531f97592968321a2680791d868f5cafdc02c8f9f059c431e7ef0f086;
    string  constant  _name = "GreenBTC";
    string  constant  _symbol = "GBTC";
    string  constant  _version = "1";

    uint256 constant  RATE_WINNING  = 20;  

    // address constant _arkreenBuilder = 0xA05A9677a9216401CF6800d28005b227F7A3cFae;
    // address constant _tokenNative = 0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889;
    // address constant _tokenART = 0x0999AFb673944a7B8E1Ef8eb0a7c6FFDc0b43E31;

    bytes32 public  _DOMAIN_SEPARATOR;

    mapping (uint256 => GreenBTCInfo)  public dataGBTC;
    mapping (uint256 => NFTStaus)  public dataNFT;

    address public _manager;
    address public _authorizer;

    address public _greenBtcImageContract;
    address public arkreenBuilderContract;
    address public tokenCART;                // CART token is bought to greenize Bitcoin by default while some other token is paid.

    OpenInfo[] internal openingBoxList;      // Box in this list could be openned internally with just a trigger command 
    OpenInfo[] internal overtimeBoxList;     // Box in this list need to be revealed with external hash information

    event GreenBitCoin(uint256 height, uint256 ARTCount, address beneficiary, uint8 greenType);
    event OpenBox(address openner, uint256 tokenID, uint256 blockNumber);

    event RevealBoxes(uint256[] revealList, bool[] wonList);

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, 'GBTC: EXPIRED');
        _;
    }

    modifier onlyManager(){
        require(msg.sender == _manager, 'GBTC: Not Manager');
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //initialize
    function initialize(address authorizer_, address builder, address cART)
        external
        virtual
        initializer
    {
        __UUPSUpgradeable_init();
        __Ownable_init_unchained();
        __ERC721_init_unchained(_name, _symbol);

        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(_name)),
                keccak256(bytes(_version)),
                block.chainid,
                address(this)
            )
        );  

        // _manager = msg.sender;
        _manager = owner();
        _authorizer = authorizer_;
        arkreenBuilderContract = builder;
        tokenCART = cART;
       
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function setManager(address newManager) public onlyOwner{
        require(newManager != address(0), "GBTC: address 0 is not allowed"); 
        _manager = newManager;
    }

    function setAuthorizer(address newAuthAddress) public onlyManager {
        require(newAuthAddress != address(0), "GBTC: address 0 is not allowed"); 
        _authorizer = newAuthAddress;
    }

    function setImageContractAddress(address newImageContractAddress) public onlyManager {
        require(newImageContractAddress != address(0), 'GBTC: address 0 is not allowed');
        _greenBtcImageContract = newImageContractAddress;
    }

    function setExchangeARTContractAddress(address newExchangeARTContract) public onlyManager {
        require(newExchangeARTContract != address(0), 'GBTC: address 0 is not allowed');
        _greenBtcImageContract = newExchangeARTContract;
    }

    function approveBuilder(address[] calldata tokens) public onlyManager {
        require(arkreenBuilderContract != address(0), "GBTC: No Builder");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], arkreenBuilderContract, type(uint256).max);
        }
    }   

    // function authMintGreenBTCWithNative(GreenBTCInfo calldata gbtc, Sig calldata sig, BadgeInfo calldata badgeInfo, uint256 deadline) public  payable ensure(deadline) {

    //     require(dataGBTC[gbtc.height].ARTCount == 0, "GBTC: only grey block can be mint");

    //     //verify signature
    //     _authVerify(gbtc, sig);

    //     //exchange for warp matic from tokenNative contract
    //     _exchangeForTokenNative(msg.value);
        
    //     //避免"CompilerError: Stack too deep."
    //     {
    //         uint128 price = _getPrice(_tokenART, _tokenNative);

    //         uint256 amountART = msg.value * (10**9) / price;
    //         // uint256 amountART = msg.value * (10**9) / (_getPrice(_tokenART, _tokenNative));

    //         uint256 modeAction = 0x03; //   bit0 = 1; 用户付钱为定额，能换取多少ART由Bank合约的兑换价格决定，实验中需要2个ART，根据兑换价格，需要0.1个matic
    //                                     //  bit1 = 1; 表示需要去Bank合约去兑换ART
    //         bytes memory callData = abi.encodeWithSelector(0x8D7FCEFD, _tokenNative, _tokenART, msg.value,
    //                                                         amountART, modeAction, deadline, badgeInfo);
    //         _actionBuilderBadge(abi.encodePacked(callData, gbtc.beneficiary));     // Pay back to msg.sender already

    //         _mintNFT(gbtc);
    //     }

    //     emit GreenBitCoin(gbtc.height, gbtc.cellCount, gbtc.beneficiary, gbtc.greenType);
    // }

    function authMintGreenBTCWithApprove(
        GreenBTCInfo    calldata gbtc, 
        Sig             calldata sig, 
        BadgeInfo       calldata badgeInfo, 
        PayInfo         calldata payInfo,
        uint256         deadline
    ) external ensure(deadline) {

        require(dataGBTC[gbtc.height].ARTCount == 0, "GBTC: Already Minted");
       
        _authVerify(gbtc, sig);                                         // verify signature

        TransferHelper.safeTransferFrom(payInfo.token, msg.sender, address(this), payInfo.amount);

        // bit0 = 1: exact payment amount; bit1 = 1: ArkreenBank is used to get CART token
        uint256 modeAction = 0x03;      

        // actionBuilderBadge(address,address,uint256,uint256,uint256,uint256,(address,string,string,string)): 0x8D7FCEFD                                            
        bytes memory callData = abi.encodeWithSelector( 0x8D7FCEFD, payInfo.token, tokenCART, payInfo.amount,
                                                        gbtc.ARTCount, modeAction, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, gbtc.beneficiary));     // Pay back to msg.sender already ??

        _mintNFT(gbtc);

        emit GreenBitCoin(gbtc.height, gbtc.ARTCount, gbtc.beneficiary, gbtc.greenType);
    }

    function authMintGreenBTCWithART(
        GreenBTCInfo calldata gbtc, 
        Sig calldata sig, 
        BadgeInfo calldata badgeInfo,
        address tokenART, 
        uint256 amountART, 
        uint256 deadline)  public  ensure(deadline) 
    {
        require(dataGBTC[gbtc.height].ARTCount == 0, "GBTC: only grey block can be mint");
        require(gbtc.ARTCount <= amountART, "GBTC: not enough ART"); 
        //verify signature
        _authVerify(gbtc, sig);

        // Transfer payement 
        TransferHelper.safeTransferFrom(tokenART, msg.sender, address(this), amountART);

        // actionBuilderBadgeWithART(address,uint256,uint256,(address,string,string,string)): 0x6E556DF8
        bytes memory callData = abi.encodeWithSelector(0x6E556DF8, tokenART, amountART, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, gbtc.beneficiary));

        _mintNFT(gbtc);

        emit GreenBitCoin(gbtc.height, gbtc.ARTCount, gbtc.beneficiary, gbtc.greenType);
    }

    /**
     * @dev Open the Green Bitcoin box, only thw owner of the box acceptable.
     */
    function openBox(uint256 tokenID) public {
        require(msg.sender == ownerOf(tokenID), "GBTC: Not Owner");
        require(dataNFT[tokenID].open == false, "GBTC: Already Opened");

        OpenInfo memory openInfo = OpenInfo(uint64(tokenID), uint64(block.number));
        openingBoxList.push(openInfo);

        dataNFT[tokenID].open = true;

        emit OpenBox(msg.sender, tokenID, block.number);
    }

    /**
     * @dev Reveal all the opened boxes stored internally. All overtime boxes will be moved to another list. 
     * waiting for another revealing with hash value.
     */
    function revealBoxes() public {                                     // onlyManager?

        uint256 openingListLength = openingBoxList.length;

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
                uint256 random = uint256(keccak256(abi.encodePacked(tokenID, ownerOf(tokenID), blockhash(openHeight))));

                if ((random % 100) < RATE_WINNING) { 
                  dataNFT[tokenID].won = true;
                  wonList[revealCount] = true;
                }

                dataNFT[tokenID].reveal = true;
                dataNFT[tokenID].hash = random;

                revealList[revealCount++] = tokenID;                    // Prepare for return data 

            } else {
                overtimeBoxList.push(openInfo);
                dataNFT[tokenID].hash = overtimeBoxList.length - 1;     // Save index to make it easy to reveal with hash value
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

        uint256[] memory revealList = new uint256[](overtimeBoxList.length);
        bool[] memory wonList = new bool[](overtimeBoxList.length);

        uint256 revealCount;
        for (uint256 index = 0; index < lengthReveal; index++) {

            uint256 tokenID = tokenList[index];
            address owner = ownerOf(tokenID);
            uint256 indexOvertime = dataNFT[tokenID].hash;                  // hash is re-used to store the index in overtime list

            uint256 random = uint256(keccak256(abi.encodePacked(tokenID, owner, hashList[index])));

            if((random % 100) < RATE_WINNING) {
                dataNFT[tokenID].won = true;
                wonList[revealCount] = true;
            }

            dataNFT[tokenID].reveal = true;
            dataNFT[tokenID].hash = random;

            // Remove the revealed item by replacing with the last item
            uint256 overtimeLast = overtimeBoxList.length - 1;
            if( indexOvertime < overtimeLast) {
                OpenInfo memory openInfo = overtimeBoxList[overtimeLast];
                overtimeBoxList[indexOvertime] = openInfo;
                dataNFT[openInfo.tokenID].hash = indexOvertime;
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

    function getOvertimeBoxList() public view returns (OpenInfo[] memory) {
        return overtimeBoxList;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory){

        // require(tokenId <= _totalCount && tokenId != 0, "invalid token id");
        require(dataGBTC[tokenId].height != 0, "GBTC: no such token minted");

        string memory svgData;
        if(dataNFT[tokenId].open == false){
            svgData = _svg_unopen_Data(tokenId);
        }else{
            svgData = _svg_open_Data(tokenId);
        }
        

        bytes memory dataURI = abi.encodePacked(
            "{",
            '"name": "Green BTC #',
            tokenId.toString(),
            '",',
            '"description": "GreenBTC: Green Bit Coin",',
            '"image": "',
            "data:image/svg+xml;base64,",
            svgData,
            '"'
            "}"
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(dataURI)));
    }


    function isUnPacking(uint256 tokenID) public view returns(bool, bool) {

        if(dataGBTC[tokenID].ARTCount == 0){
            return (false, false);
        }else{
            return (true, dataNFT[tokenID].open);
        }
    }

    function _svg_open_Data(uint256 tokenId) internal view  returns(string memory openData){
        if(dataNFT[tokenId].won){

            //此处使用staticcall模式进行调用，原因：_imageContract合约的getCertificateSVGBytes函数使用struct GreenBTCInfo
            //作为参数，如果不使用staticcall，则必须在本合约、接口合约、目标合约之间协调struct Green_BTC的定义。本合约不希望
            //将struct Green_BTC的定义独立出去(至少目前不希望)，所以此处使用staticcall进行处理，虽然稍显繁琐，但保留本合约的
            //独立性，以及灵活性。
            bytes4 selector = bytes4(keccak256("getCertificateSVGBytes((uint256,uint256,address,uint8,string,string))"));
            bytes memory callData = abi.encodeWithSelector(selector, dataGBTC[tokenId]);

            (bool success, bytes memory returndata) = _greenBtcImageContract.staticcall(callData);
            require(success, "GBTC: call image contract failed");
            openData = abi.decode(returndata, (string));


        }else{

            // bytes4 selector = bytes4(keccak256("getGreenTreeSVGBytes()"));
            // bytes memory callData = abi.encodeWithSelector(selector);

            // (bool success, bytes memory returndata) = _imageContract.staticcall(callData);
            // require(success, "call image contract failed");
            // openData = abi.decode(returndata, (string));

            openData = IGreenBTCImage(_greenBtcImageContract).getGreenTreeSVGBytes();
        }
        

    }

    function _svg_unopen_Data(uint256 tokenId ) internal view returns(string memory){

        // bytes4 selector = bytes4(keccak256("getBlindBoxSVGBytes(uint256)"));
        // bytes memory callData = abi.encodeWithSelector(selector, tokenId);

        // (bool success, bytes memory returndata) = _imageContract.staticcall(callData);
        // require(success, "call image contract failed");
        // return abi.decode(returndata, (string));

        return IGreenBTCImage(_greenBtcImageContract).getBlindBoxSVGBytes(tokenId);

    }

    function _mintNFT(GreenBTCInfo calldata gbtc) internal {

        dataGBTC[gbtc.height] = gbtc;

        NFTStaus memory nft;
        nft.owner = gbtc.beneficiary;
        nft.blockHeight = uint64(gbtc.height);
        dataNFT[gbtc.height] = nft;

        _mint(gbtc.beneficiary, gbtc.height);
    }

    function _authVerify(GreenBTCInfo calldata gbtc, Sig calldata sig) internal view {

        bytes32 greenBTCHash = keccak256(abi.encode(_GREEN_BTC_TYPEHASH, gbtc.height, gbtc.energyStr, gbtc.ARTCount, gbtc.blockTime, gbtc.beneficiary, gbtc.greenType));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, greenBTCHash));
        address recoveredAddress = ecrecover(digest, sig.v, sig.r, sig.s);

        require(recoveredAddress == _authorizer, "GBTC: Invalid Singature");
    }

    // function _exchangeForTokenNative(uint256 amount) internal {

    //     bytes4 selector = bytes4(keccak256("deposit()"));
    //     bytes memory callData = abi.encodeWithSelector(selector);

    //     (bool success, bytes memory returndata) = _tokenNative.call{value: amount}(callData);

    //      if (!success) {
    //         if (returndata.length > 0) {
    //             // solhint-disable-next-line no-inline-assembly
    //             assembly {
    //                 let returndata_size := mload(returndata)
    //                 revert(add(32, returndata), returndata_size)
    //             }
    //         } else {
    //             revert("GBTC: Error Call to deposit");
    //         }
    //     }    
    // }

    function _actionBuilderBadge(bytes memory callData) internal {
        (bool success, bytes memory returndata) = arkreenBuilderContract.call(callData);

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

    function _getPrice(address tokenART, address tokenPay) internal view returns(uint128) {

        address banker;

        bytes4 selector = bytes4(keccak256("artBank()"));
        bytes memory callData = abi.encodeWithSelector(selector);

        (bool success, bytes memory returndata) = arkreenBuilderContract.staticcall(callData);
        require(success, "GBTC: get artBank address failed");
        banker = abi.decode(returndata, (address));
        

        // address tokenART = 0x0999AFb673944a7B8E1Ef8eb0a7c6FFDc0b43E31;
        // address tokenPay = 0x0FA8781a83E46826621b3BC094Ea2A0212e71B23;
        // address tokenPay = 0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889;

        selector = bytes4(keccak256("saleIncome(address,address)"));
        callData = abi.encodeWithSelector(selector, tokenART, tokenPay);

        (success, returndata) = banker.staticcall(callData);
        require(success, "GBTC: get price failed");
        (uint128 price, ) = abi.decode(returndata, (uint128, uint128));

        return price;
        
    }





}
