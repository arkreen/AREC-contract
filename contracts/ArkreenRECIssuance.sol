// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import "./interfaces/IMinerRegister.sol";
import "./interfaces/IArkreenRegistery.sol";
import "./interfaces/IArkreenMiner.sol";
import "./interfaces/IArkreenRetirement.sol";

import "./interfaces/IERC20.sol";
import "./libraries/TransferHelper.sol";
import "./interfaces/IERC20Permit.sol";
import "./ArkreenRECIssuanceStorage.sol";
import "./interfaces/IPausable.sol";

// Import this file to use console.log
// import "hardhat/console.sol";

contract ArkreenRECIssuance is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC721EnumerableUpgradeable,
    ArkreenRECIssuanceStorage
{
    // using SafeMath for uint256;	// seems not necessary
    using AddressUpgradeable for address;

    // Public variables
    string public constant NAME = 'Arkreen REC';
    string public constant SYMBOL = 'A-REC';

    // Events
    event RECRequested(address owner, uint256 tokenId);
    event RECRejected(uint256 tokenId);
    event RECDataUpdated(address owner, uint256 tokenId);
    event RECCertified(address issuer, uint256 tokenId);
    event RECCanceled(address owner, uint256 tokenId);    
    event RECLiquidized(address owner, uint256 tokenId, uint256 amountREC);
    event RedeemFinished(address redeemEntity, uint256 tokenId, uint256 offsetActionId);

    // Modifiers
    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'RECIssuance: EXPIRED');
        _;
    }

    modifier whenNotPaused() {
        require(!IPausable(arkreenRegistery).paused(), 'AREC: Paused');
        _;
    }    
  
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _tokenAKRE, address arkRegistry) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();
        __ERC721_init_unchained(NAME, SYMBOL);
        tokenAKRE = _tokenAKRE;
        arkreenRegistery = arkRegistry;
        baseURI = 'https://www.arkreen.com/A-REC/' ;
    }

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}    

    /**
     * @dev To mint the REC NFT. After minted, the NFT is in pending status.
     * It needs to certified by the issuer before it can be transferred/retired/liquidized.
     * recRequest The request info to mint the REC NFT
     * permitToPay Payment info to mint the REC NFT
     */
    function mintRECRequest(
        RECRequest calldata recRequest,
        Signature calldata permitToPay
    ) external ensure(permitToPay.deadline) whenNotPaused returns (uint256 tokenId) {

        // Check issuer address
        require(IArkreenRegistery(arkreenRegistery).isRECIssuer(recRequest.issuer), 'AREC: Wrong Issuer');

        // Check REC time period
        require(recRequest.startTime < recRequest.endTime && recRequest.endTime < block.timestamp, 'AREC: Wrong Period');

        // Check the caller be acceptable miner
        address sender = _msgSender();
        address arkreenMiner = IArkreenRegistery(arkreenRegistery).getArkreenMiner();

        // require(arkreenMiner.isContract(), "AREC: Wrong Miner Contract");            // no need to check
        require(IArkreenMiner(arkreenMiner).isOwner(sender), "AREC: Not Miner");

        // Check payment appoval
        require( permitToPay.token == tokenAKRE || paymentTokens[permitToPay.token], "AREC: Wrong Payment Token");
        IERC20Permit(permitToPay.token).permit(sender, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        tokenId = totalSupply() + 1;        
        _safeMint(sender, tokenId);

        // Prepare REC data
        RECData memory recData;
        recData.issuer =  recRequest.issuer;
        recData.serialNumber = '';
        recData.minter = sender;
        recData.startTime =  recRequest.startTime;
        recData.endTime =  recRequest.endTime;
        recData.amountREC =  recRequest.amountREC;
        recData.status = uint8(RECStatus.Pending);        
        recData.cID =  recRequest.cID;
        recData.region =  recRequest.region;        
        recData.url =  recRequest.url;
        recData.memo =  recRequest.memo;

        allRECData[tokenId] = recData;

        PayInfo memory payInfo = PayInfo({token: permitToPay.token, value: permitToPay.value});
        allPayInfo[tokenId] = payInfo;

        emit RECRequested(sender, tokenId);

        // Transfer the REC mint fee
        TransferHelper.safeTransferFrom(permitToPay.token, _msgSender(), address(this), permitToPay.value);
    }

    /**
     * @dev To reject the REC NFT mint request by the issuer for any reason.
     * Only can be called while the NFT is in pending state.
     * tokenId The ID of the REC NFT
     */
    function rejectRECRequest(uint256 tokenId) external whenNotPaused
    {
        // Check that the call is the issuer of the token
        address issuer = _msgSender();
        require(IArkreenRegistery(arkreenRegistery).isRECIssuer(issuer), 'AREC: Not Issuer');
        require(issuer == allRECData[tokenId].issuer, 'AREC: Wrong Issuer');

       // Only pending REC can be cancelled
        require(allRECData[tokenId].status == uint8(RECStatus.Pending), 'AREC: Wrong Status');  

        // Set status to Rejected
        allRECData[tokenId].status = uint8(RECStatus.Rejected);
        emit RECRejected(tokenId);
    }
    
    /**
     * @dev To update the REC NFT mint info while it is rejected by the the issuer.
     * tokenId The ID of the REC NFT to update
     */
    function updateRECData(
        uint256         tokenID,
        address         issuer,
        string memory   region,
        string memory   url,
        string memory   memo) external whenNotPaused
    {
        // Only REC owner allowed to change the REC data
        require(ownerOf(tokenID) == _msgSender(), 'AREC: Not Owner');     // owner should be the minter also

        // Only rejected REC can be cancelled
        require(allRECData[tokenID].status == uint8(RECStatus.Rejected), 'AREC: Wrong Status');  

        // Check issuer address
        require(IArkreenRegistery(arkreenRegistery).isRECIssuer(issuer), 'AREC: Wrong Issuer');

        allRECData[tokenID].issuer = issuer;                              
        allRECData[tokenID].region = region;                    // Null string is not checked, as it could be set to null
        allRECData[tokenID].url = url;
        allRECData[tokenID].memo = memo;

        allRECData[tokenID].status =  uint8(RECStatus.Pending);
        emit RECDataUpdated(_msgSender(), tokenID);
    }

    /**
     * @dev To cancel the REC NFT mint request,only can be called the NFT owner.
     * REC NFT mint fee is refund to the owner after the transaction.
     * tokenId The ID of the REC NFT to update
     */
    function cancelRECRequest(uint256 tokenID) external whenNotPaused {

        // Only REC owner allowed to cancel the request
        require(ownerOf(tokenID) == _msgSender(), 'AREC: Not Owner');

        // Only pending REC can be cancelled
        require(allRECData[tokenID].status == uint8(RECStatus.Rejected), 'AREC: Wrong Status');  

        allRECData[tokenID].status = uint8(RECStatus.Cancelled);

        // delete the payment info to save storage
        delete allPayInfo[tokenID];
        emit RECCanceled(_msgSender(), tokenID);

        // Refund the request fee
        TransferHelper.safeTransfer(allPayInfo[tokenID].token, _msgSender(), allPayInfo[tokenID].value);

    }

    /**
     * @dev To certify the REC NFT mint request by the REC issuer.
     * tokenId The ID of the REC NFT to certify.
     * serialNumber The SN of REC NFT certificaton.
     */
    function certifyRECRequest(uint256 tokenID, string memory serialNumber) external whenNotPaused
    {
        // Check the issuer
        address issuer = _msgSender();
        require(IArkreenRegistery(arkreenRegistery).isRECIssuer(issuer), 'AREC: Not Issuer');

        // Check if the caller is the specified issuer
        require(issuer == allRECData[tokenID].issuer, 'AREC: Wrong Issuer');

        // Only pending REC can be Certified
        require(allRECData[tokenID].status == uint8(RECStatus.Pending), 'AREC: Wrong Status');  

        // Uniqueness is not checked here assuming the issuer has checked this point
        allRECData[tokenID].serialNumber = serialNumber;            
        allRECData[tokenID].status = uint8(RECStatus.Certified);

        address paymentToken = allPayInfo[tokenID].token;
        uint256 paymentValue = allPayInfo[tokenID].value;

        uint256 amountREC = allRECData[tokenID].amountREC;
        allRECByIssuer[issuer] += amountREC;                        // REC amount by the issuer
        allRECIssued += amountREC;                                  // All REC amount

        // Update the issuer total payment value
        paymentByIssuer[issuer][paymentToken] += paymentValue;

        // delete the payment info to save storage
        delete allPayInfo[tokenID];

        emit RECCertified(issuer, tokenID);
    }

    /**
     * @dev Redeem the REC NFT by retiring the NFT and registering an offset action
     */
    function redeem(uint256 tokenId) public virtual whenNotPaused returns (uint256 offsetActionId) {
        offsetActionId = _redeem(_msgSender(), tokenId);
    }

    /**
     * @dev The third party triggers the RE redeem in the approval of the owner
     */
    function redeemFrom(address account, uint256 tokenId)
        external virtual whenNotPaused returns (uint256 offsetActionId) 
    {
        require(_isApprovedOrOwner(msg.sender, tokenId), 'AREC: Not Approved');
        offsetActionId = _redeem(account, tokenId);
    }
   
    /**
     * @dev The internal function to offset the REC NFT.
     */
    function _redeem(address owner, uint256 tokenId) internal virtual returns (uint256 offsetActionId) {

        // Check if the REC owner
        require( ownerOf(tokenId) == owner, 'AREC: Not Owner');

        // Check if the REC NFT is in certified stataus
        require( allRECData[tokenId].status == uint8(RECStatus.Certified), 'AREC: Not Certified');

        // Register the offset event
        address retirementContract = IArkreenRegistery(arkreenRegistery).getArkreenRetirement();
        address issuerREC = allRECData[tokenId].issuer;
        uint256 amount = allRECData[tokenId].amountREC;
        offsetActionId = IArkreenRetirement(retirementContract).registerOffset(owner, issuerREC, amount, tokenId);

        // Send the REC NFT to the retirement contract and set the REC NFT status to be Retired
        _safeTransfer(owner, retirementContract, tokenId, "Redeem");
        allRECData[tokenId].status = uint8(RECStatus.Retired);
        allRECRedeemed += amount;

        emit RedeemFinished(owner, tokenId, offsetActionId);
    }

   /**
     * @dev Redeem the REC NFT and mint an offset certificate.
     * @param tokenId Id of the REC NFT to redeem.
     * @param beneficiary Beneficiary address for whom the REC was offset.
     * @param offsetEntityID ID string of the offset entity.
     * @param beneficiaryID ID string of the beneficiary.
     * @param offsetMessage Message to illustrate the offset intention.
     */
    function redeemAndMintCertificate(
        uint256         tokenId, 
        address         beneficiary,
        string calldata offsetEntityID,
        string calldata beneficiaryID,
        string calldata offsetMessage
    ) external whenNotPaused virtual {

        // Check if approved
        require(_isApprovedOrOwner(msg.sender, tokenId), 'AREC: Not Approved');

        // Redeem the specified REC NFT
        address owner = ownerOf(tokenId);
        uint256 offsetActionId = _redeem(owner, tokenId);

        uint256[] memory offsetActionIds = new uint256[](1);
        offsetActionIds[0] = offsetActionId;

        // Issue the offset certificate NFT
        address retirementContract = IArkreenRegistery(arkreenRegistery).getArkreenRetirement();
        IArkreenRetirement(retirementContract)
                .mintCertificate(owner, beneficiary, offsetEntityID, beneficiaryID, offsetMessage, offsetActionIds);
   
    }   


   /**
     * @dev liquidize the REC NFT and mint the corresponding ERC20 token
     * @param tokenId Id of the REC NFT to liquidize
     */
    function liquidizeREC( uint256 tokenId ) external whenNotPaused {

        require(_isApprovedOrOwner(msg.sender, tokenId), 'AREC: Not Approved');

        // Check if the REC status
        require( allRECData[tokenId].status == uint8(RECStatus.Certified), 'AREC: Not Certified');

        address issuerREC = allRECData[tokenId].issuer;
        uint256 amountREC = allRECData[tokenId].amountREC;
        address tokenREC = IArkreenRegistery(arkreenRegistery).getRECToken(issuerREC) ;

        // Transfer the REC NFT to the ERC20 token contract to be liquidized
        address owner = ownerOf(tokenId);        
        _safeTransfer(owner, tokenREC, tokenId, "");

        // Set the AREC status to be Liquidized
        allRECData[tokenId].status = uint8(RECStatus.Liquidized);  

        // Accumulate the Liquidized REC amount
        allRECLiquidized += amountREC;
        emit RECLiquidized(owner, tokenId, amountREC);

    }

    /// @dev retrieve all data from VintageData struct
    function getRECData(uint256 tokenId) external view virtual returns (RECData memory) {
        return (allRECData[tokenId]);
    }

    /// @dev add or remove the acceptable payment token
    function managePaymentToken(address token, bool yesOrNo) external virtual onlyOwner {
        paymentTokens[token] = yesOrNo;
    }

    /**
     * @dev Withdraw all the REC certification fee
     * @param token address of the token to withdraw, USDC/ARKE
     */
    function withdraw(address token, address receiver) public whenNotPaused onlyOwner {
        if(receiver == address(0)) {
            receiver = _msgSender();
        }
        uint256 balance = IERC20(token).balanceOf(address(this));
        TransferHelper.safeTransfer(token, receiver, balance);
    }    

    /**
     * @dev Hook that is called before any token transfer.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override (ERC721EnumerableUpgradeable) {

        // Only certified REC can be transferred
        if(from != address(0)) {
          require(allRECData[tokenId].status == uint8(RECStatus.Certified), 'AREC: Wrong Status');
        }

        super._beforeTokenTransfer(from, to, tokenId);
    }    

    function setBaseURI(string memory newBaseURI) external virtual onlyOwner {
        baseURI = newBaseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Returns the URI for the given token.  
     */    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory url = allRECData[tokenId].url;
        string memory base = baseURI;

        // If there is no base URI, return url
        if (bytes(base).length == 0) {
            return url;
        }
        // If both are set, concatenate them
        if (bytes(url).length > 0) {
            return string(abi.encodePacked(base, url));
        }

        return super.tokenURI(tokenId);
    }
}