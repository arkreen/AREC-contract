// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../libraries/TransferHelper.sol";
import "../interfaces/IArkreenBadge.sol";
import "../interfaces/IPausable.sol";
import "../interfaces/IArkreenRECBank.sol";
import "../interfaces/IArkreenBuilder.sol";
import "../interfaces/IArkreenRECToken.sol";

contract KWhToken is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC20Upgradeable
{
    struct SwapInfo {
        uint64      priceForSwap;           // 1 ART -> X Payment token
        uint96      amountReceived;         // Amount of payment token received
        uint96      amountKWhSwapped;     	// Amount of kWh converted
        uint96      amountPaidOffset;       // Amount paid to buy&Offset ART, or ART being offset
    }

    // Public constant variables
    string public constant NAME = "REC kWh";
    string public constant SYMBOL = "kWh";

    address public tokenART;
    address public artBank;               						// Address of the ART sales bank contract
    address public arkreenBuilder;
    address public offsetManager;

    mapping(address => SwapInfo) public swapInfo;               // Mapping ART/USDC/USDT -> ConverterInfo

    IArkreenBuilder.BadgeInfo public badgeInfo;									// Badge info used for AREC Climate badge

    // Events
    event KWhMinted(address indexed tokenPayemnt, uint256 amountPayment, uint256 amountKWh);
    event ARTConverted(address indexed user, address indexed tokenPayemnt, uint256 amountPayment, uint256 amountKWh);
    event SwapPriceChanged(address indexed payToken, uint256 newPrice);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address art, address bank, address builder, address manager) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();        
        __ERC20_init_unchained(NAME, SYMBOL);
        require ((art != address(0)) && (bank != address(0)) && (builder != address(0)));
        tokenART = art;
        artBank = bank;
        arkreenBuilder = builder;
        offsetManager = manager;
        TransferHelper.safeApprove(art, builder, type(uint256).max);
    }

    function postUpdate() external onlyProxy onlyOwner
    {
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}    

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    modifier onlyOwnerOrManager(){
        require ((msg.sender == offsetManager) || (msg.sender == owner()), "kWh: Not Allowed");
        _;
    }

    /**
     * @dev Approve the tokens which can be transferred from this GreenBTC contract by arkreenBuilder
     * @param tokens The token list
     */
    function approveBank(address[] calldata tokens) public onlyOwner {
        require(arkreenBuilder != address(0), "kWh: No Owner");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], artBank, type(uint256).max);
        }
    }

    function MintKWh(address tokenToPay, uint256 amount) public onlyOwnerOrManager {

        uint256 amountART = amount;
        if (tokenToPay != tokenART) {
            // buyART(address tokenPay,address tokenART,uint256 amountPay,uint256 amountART,bool isExactPay)
            amountART = IArkreenRECBank(artBank).buyART(tokenToPay, tokenART, amount, 0, true);
        }

        // actionBuilderBadgeWithART(address tokenART, uint256 amountART, uint256 deadline, BadgeInfo calldata badgeInfo)
        IArkreenBuilder.BadgeInfo memory badgeInfoMem = badgeInfo;
        IArkreenBuilder(arkreenBuilder).actionBuilderBadgeWithART(tokenART, amountART, type(uint256).max, badgeInfoMem);

        uint256 ratioFeeOffset = IArkreenRECToken(tokenART).getRatioFeeOffset(); 
        if (ratioFeeOffset != 0) {
            amountART = amountART * (10000 - ratioFeeOffset) / 10000;
        }

        emit KWhMinted(tokenToPay, amount, amountART);
        _mint(address(this), amountART);
    }


    /**
     * @dev Convert ART/USDC/UDSDT tokens to kWh tokens
     */
    function convertKWh(address tokenToPay, uint256 amountPayment) public returns (uint256) {

        uint256 price = swapInfo[tokenToPay].priceForSwap;
        require (price != 0, "kWh: Payment Token Not Supported");

        uint256 amountKWh = amountPayment;
        if (tokenToPay != tokenART) {
            amountKWh = amountPayment * price / (10**6);              // USDT/USDC decimal is 6, so hardcoded here
        }

        require(IERC20Upgradeable(tokenToPay).transferFrom(msg.sender, address(this), amountPayment));
        require(IERC20Upgradeable(this).transfer(msg.sender, amountKWh));
        swapInfo[tokenToPay].amountReceived += uint96(amountPayment);
        swapInfo[tokenToPay].amountKWhSwapped += uint96(amountKWh);

        emit ARTConverted(msg.sender, tokenToPay, amountPayment, amountKWh);
        return amountKWh;
    }

    /// @dev Receive hook to liquidize Arkreen RE Certificate into RE ERC20 Token
    function onERC721Received(
        address, /* operator */
        address, /* from */
        uint256, /* tokenId*/
        bytes calldata /* data */
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }


    /**
     * @dev Change the ART swap price based on the payToken. Price-zero means not-supporting
     * @param payToken Address of the payment token used to pay for swapping ART. 
     * @param newPrice Price of the ART token priced in payment token. 
    */
    function changeSwapPrice(address payToken, uint256 newPrice ) external onlyOwnerOrManager {
        swapInfo[payToken].priceForSwap = uint64(newPrice);            // price = 0 to disable the payToken
        emit SwapPriceChanged(payToken, newPrice);    
    }  

    /**
     * @dev Set the new badge info used for offset ART to mint kWh token.
     * @param newBadgeInfo new badgeinfo to be used.
    */
    function setBadgeInfo(IArkreenBuilder.BadgeInfo calldata newBadgeInfo) external onlyOwnerOrManager {
	    badgeInfo = newBadgeInfo;
    }  
}