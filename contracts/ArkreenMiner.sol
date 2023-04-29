// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import "./libraries/TransferHelper.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IERC20Permit.sol";
import "./ArkreenMinerTypes.sol";

// Import this file to use console.log
// import "hardhat/console.sol";

contract ArkreenMiner is 
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC721EnumerableUpgradeable
{
    using AddressUpgradeable for address;

    // Public variables
    string public constant NAME = 'Arkreen Miner';
    string public constant SYMBOL = 'AKREM';

    address public tokenAKRE;                       // Token adddress of AKRE

    // All registered miner manufactures
    mapping(address => bool) public AllManufactures;

    // All miner infos
    mapping(uint256 => Miner) public AllMinerInfo;

    // All managers with various privilege
    mapping(uint256 => address) public AllManagers;
     
    bytes32 public DOMAIN_SEPARATOR;

    // Mapping from miner address to the respective token ID
    mapping(address => uint256) public AllMinersToken;

    string public baseURI;

    // Miner white list mapping from miner address to miner type
    mapping(address => uint8) public whiteListMiner;

    uint256 public totalStandardMiner;                              // Total amount of standard miner

    address public tokenNative;                                     // The wrapped token of the Native token, such as WETH, WMATIC

    // Constants
    // keccak256("RemoteMinerOnboard(address owner,address miners,address token,uint256 price,uint256 deadline)");
    bytes32 public constant REMOTE_MINER_TYPEHASH = 0xE397EAA556C649D10F65393AC1D09D5AA50D72547C850822C207516865E89E32;  

    // keccak256("StandardMinerOnboard(address owner,address miner,uint256 deadline)");
    bytes32 public constant STANDARD_MINER_TYPEHASH = 0x73F94559854A7E6267266A158D1576CBCAFFD8AE930E61FB632F9EC576D2BB37;  

    // Events
    event MinerOnboarded(address indexed owner, address indexed miner);
    event StandardMinerOnboarded(address indexed owner, address indexed miner);
    event RemoteMinersInBatch(address[] owners, address[] miners);
    
    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, 'Arkreen Miner: EXPIRED');
        _;
    }

    modifier onlyMinerManager() {
        require(_msgSender() == AllManagers[uint256(MinerManagerType.Miner_Manager)], 'Arkreen Miner: Not Miner Manager');
        _;
    }    

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _tokenAKRE, address _tokenNative, address _minerManager, address _minerAuthority)
        external
        virtual
        initializer
    {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();
        __ERC721_init_unchained(NAME, SYMBOL);
        tokenAKRE = _tokenAKRE;
        tokenNative = _tokenNative;
        AllManagers[uint256(MinerManagerType.Miner_Manager)] = _minerManager;
        AllManagers[uint256(MinerManagerType.Register_Authority)] = _minerAuthority;
        baseURI = 'https://www.arkreen.com/miners/';

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes("Arkreen Miner")),
                keccak256(bytes('1')),
                block.chainid,
                address(this)
            )
        );  
    }

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
        onlyOwner
    {}

    /**
     * @dev Onboarding a remote Miner with Native token (MATIC)
     * @param owner address receiving the remote miner
     * @param miner address of the remote miner onboarding
     * @param permitMiner signature of miner register authority to confirm the miner address and price.  
     */
    function RemoteMinerOnboardNative(
        address     owner,
        address     miner,
        Signature   calldata  permitMiner
    ) external payable ensure(permitMiner.deadline) {

        // Check payment value
        require( (tokenNative != address(0)) && (tokenNative == permitMiner.token) && 
                  (msg.value == permitMiner.value), "Arkreen Miner: Payment error");

        // Check for minting remote miner  
        _mintRemoteMinerCheck(owner, miner, permitMiner);

        // mint new remote miner
        _mintRemoteMiner(owner, miner);
        emit MinerOnboarded(owner, miner);
    }    

    /**
     * @dev Onboarding a remote miner while the payment has been approved
     * @param owner address receiving the remote miner
     * @param miner address of the remote miner onboarding
     * @param permitMiner signature of miner register authority to confirm the miner address and price.  
     */
    function RemoteMinerOnboardApproved(
        address     owner,
        address     miner,
        Signature   calldata  permitMiner
    ) external ensure(permitMiner.deadline) {

        // Check for minting remote miner  
        _mintRemoteMinerCheck(owner, miner, permitMiner);

        // mint new remote miner
        _mintRemoteMiner(owner, miner);

        // Transfer onboarding fee
        address sender = _msgSender();
        TransferHelper.safeTransferFrom(permitMiner.token, sender, address(this), permitMiner.value);

        emit MinerOnboarded(owner, miner);
    }

    /**
     * @dev Check for minting a remote Miner
     * @param owner address receiving the remote miner
     * @param miner address of the remote miner onboarding
     * @param permitMiner signature of miner register authority to confirm the miner address and price.  
     */
    function _mintRemoteMinerCheck( 
        address     owner,
        address     miner,
        Signature   memory  permitMiner
    ) view internal {

        // Check miner is white listed  
        require( (whiteListMiner[miner] == uint8(MinerType.RemoteMiner) ), 'Arkreen Miner: Wrong Miner');
        require(AllMinersToken[miner] == 0, "Arkreen Miner: Miner Repeated");

        // Check signature
        // keccak256("RemoteMinerOnboard(address owner,address miners,address token,uint256 price,uint256 deadline)");
        bytes32 hashRegister = keccak256(abi.encode(REMOTE_MINER_TYPEHASH, owner, miner, 
                                          permitMiner.token, permitMiner.value, permitMiner.deadline));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR, hashRegister));
        address recoveredAddress = ecrecover(digest, permitMiner.v, permitMiner.r, permitMiner.s);
  
        require(recoveredAddress != address(0) && 
                recoveredAddress == AllManagers[uint256(MinerManagerType.Register_Authority)], 'Arkreen Miner: INVALID_SIGNATURE');
    }

    /**
     * @dev mint a remote Miner
     * @param owner address receiving the remote miner
     * @param miner address of the remote miner onboarding
     */
    function _mintRemoteMiner( address owner, address miner) internal {

        // Prepare to mint new Remote/Standard miner
        Miner memory newMiner;
        newMiner.mAddress = miner;
        newMiner.mType = MinerType.RemoteMiner;
        newMiner.mStatus = MinerStatus.Normal;
        newMiner.timestamp = uint32(block.timestamp);    

        // mint new Remote/Standard miner
        uint256 realMinerID = totalSupply() + 1;
        _safeMint(owner, realMinerID);
        AllMinersToken[miner] = realMinerID;
        AllMinerInfo[realMinerID] = newMiner;

        delete whiteListMiner[miner];
    }

    /**
     * @dev Onboarding a remote Miner
     * @param owner address receiving the remote miner
     * @param miner address of the remote miner onboarding
     * @param permitMiner signature of miner register authority to confirm the miner address and price.  
     * @param permitToPay signature of payer to pay the onboarding fee
     */
    function RemoteMinerOnboard(
        address     owner,
        address     miner,
        Sig       calldata  permitMiner,
        Signature calldata  permitToPay
    ) external ensure(permitToPay.deadline) {

        // Check miner is white listed  
        Signature memory fullPermitMiner = Signature(permitToPay.token, permitToPay.value, permitToPay.deadline,
                                            permitMiner.v, permitMiner.r, permitMiner.s);
 
        _mintRemoteMinerCheck(owner, miner, fullPermitMiner);

        // Permit payment
        address sender = _msgSender();
        IERC20Permit(permitToPay.token).permit(sender, address(this), 
                                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // mint new remote miner
        _mintRemoteMiner(owner, miner);

        // Transfer onboarding fee
        TransferHelper.safeTransferFrom(permitToPay.token, sender, address(this), permitToPay.value);

        emit MinerOnboarded(owner, miner);
    }

    /**
     * @dev Onboarding standard miner
     * @param owner address receiving the standard miner
     * @param miner address of the standard miner onboarding
     * @param permitMiner signature of onboarding manager to approve the onboarding
     */
    function StandardMinerOnboard(
        address owner,
        address miner,
        uint256 deadline,
        Sig     calldata permitMiner
    ) external ensure(deadline) {

        // Check the starndard address
        require(!miner.isContract(), 'Arkreen Miner: Not EOA Address');
        require(AllMinersToken[miner] == 0, "Arkreen Miner: Miner Repeated");
        require( (whiteListMiner[miner] == uint8(MinerType.StandardMiner) ), 'Arkreen Miner: Wrong Miner');        

        // Check signature
        bytes32 hashRegister = keccak256(abi.encode(STANDARD_MINER_TYPEHASH, owner, miner, deadline));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR, hashRegister));
        address recoveredAddress = ecrecover(digest, permitMiner.v, permitMiner.r, permitMiner.s);
  
        require(recoveredAddress != address(0) && 
                recoveredAddress == AllManagers[uint256(MinerManagerType.Register_Authority)], 'Arkreen Miner: INVALID_SIGNATURE');

        Miner memory tmpMiner;
        tmpMiner.mAddress = miner;
        tmpMiner.mType = MinerType.StandardMiner;
        tmpMiner.mStatus = MinerStatus.Normal;
        tmpMiner.timestamp = uint32(block.timestamp);        

        // Mint a new standard miner
        uint256 minerID = totalSupply() + 1;
        _safeMint(owner, minerID);
        AllMinersToken[miner] = minerID;
        AllMinerInfo[minerID] = tmpMiner;

        // Increase the counter of total standard miner 
        totalStandardMiner += 1;      
        delete whiteListMiner[miner]; 

        // emit onboarding event
        emit StandardMinerOnboarded(owner,  miner);
    }

    /**
     * @dev Onboarding remote miners in batch
     * @param owners addresses receiving the remote miners
     * @param miners addresses of the remote miners onboarding
     */
    function RemoteMinerOnboardInBatch(
        address[]  calldata   owners,
        address[]  calldata   miners
    ) external onlyMinerManager {

        require(owners.length == miners.length, 'Arkreen Miner: Wrong Address List');

        // Prepare to mint new remote miners, only remote miners
        Miner memory newMiner;
        newMiner.mType = MinerType.RemoteMiner;
        newMiner.mStatus = MinerStatus.Normal;
        newMiner.timestamp = uint32(block.timestamp);

        for(uint256 index; index < owners.length; index++) {
            // Mint new remote miners one by one
            uint256 remoteMinerID = totalSupply() + 1;
            newMiner.mAddress = miners[index];
            _safeMint(owners[index], remoteMinerID);
            AllMinersToken[newMiner.mAddress] = remoteMinerID;            
            AllMinerInfo[remoteMinerID] = newMiner;
        }
        // Need to emit? If yes, data may be big 
        emit RemoteMinersInBatch(owners, miners);
    }

    /**
     * @dev Get all the miner info of the specified miner
     * @param addrMiner miner address
     */
    function GetMinerInfo(address addrMiner) external view returns (address owner, Miner memory miner) {
        uint256 minerID = AllMinersToken[addrMiner];
        owner = ownerOf(minerID);
        miner = AllMinerInfo[minerID];
    }

    /**
     * @dev Get all the miner address of the owner
     * @param owner owner address
     */
    function GetMinersAddr(address owner) external view returns (address[] memory minersAddr) {
        uint256 totalMiners = balanceOf(owner);
        minersAddr = new address[](totalMiners);
        for(uint256 index;  index < totalMiners; index++) {     
            uint256 minerID = tokenOfOwnerByIndex(owner, index);
            minersAddr[index] = AllMinerInfo[minerID].mAddress;
        }
    }

    /**
     * @dev Register or unregister miner manufactures
     * @param manufactures manufactures to be registered or unregistered
     * @param yesOrNo = true, to register manufactures, = false, to unregister manufactures
     */
    function ManageManufactures(address[] calldata manufactures, bool yesOrNo) external onlyOwner {
      for(uint256 index;  index < manufactures.length; index++) {
        AllManufactures[manufactures[index]] = yesOrNo;
      }
    }

    /**
     * @dev Update the miner status
     * @param minerID miner ID of any type of miners
     * @param minerStatus new status
     */
    function SetMinersStatus(uint256 minerID, MinerStatus minerStatus) external onlyOwner {
        require(minerStatus != MinerStatus.Pending, 'Arkreen Miner: Wrong Input');      
        AllMinerInfo[minerID].mStatus = minerStatus;
    }

    /**
     * @dev Update the miner white list, add/remove the miners to/from the white list.
     *      Only miners in the white list are allowed to onboard as an NFT.
     * @param typeMiner Type of the miners to add, MinerType.Empty(=0) means to remove the miners
     * @param addressMiners List of the miners
     */
    function UpdateMinerWhiteList(uint8 typeMiner, address[] calldata addressMiners) external onlyMinerManager {
      address tempAddress;
      for(uint256 index; index < addressMiners.length; index++) {
        tempAddress = addressMiners[index];
        if(typeMiner == 0xFF) {
          delete whiteListMiner[tempAddress];
          continue;
        }
        // Checked for non-existence
        require( tempAddress != address(0) && !tempAddress.isContract(), 'Arkreen Miner: Wrong Address');     
        require( whiteListMiner[tempAddress] == 0, 'Arkreen Miner: Miners Repeated');      
        whiteListMiner[tempAddress] = uint8(typeMiner);
      }
    }

    /**
     * @dev Check if holding miners
     * @param owner owner address
     */
    function isOwner(address owner) external view returns (bool) {
        // just considering number of tokens, token status not checked 
        return balanceOf(owner) > 0;
    }

    /**
     * @dev Set the Arkreen managing accounts 
     * @param managerType type of the managing account
     * @param managerAddress address of the managing account     
     */
    function setManager(uint256 managerType, address managerAddress) external onlyOwner {
      AllManagers[managerType] = managerAddress;
    }

    /**
     * @dev Set the native token address
     * @param native address, not checked againt zero address to disable payment by native token    
     */
    function setNativeToken(address native) external onlyOwner {
      tokenNative = native;
    }    

    /**
     * @dev Withdraw all the onboarding fee
     * @param token address of the token to withdraw, USDC/ARKE
     */
    function withdraw(address token) public onlyOwner {
        address receiver = AllManagers[uint256(MinerManagerType.Payment_Receiver)];
        if(receiver == address(0)) {
            receiver = _msgSender();
        }
        uint256 balance = IERC20(token).balanceOf(address(this));
        TransferHelper.safeTransfer(token, receiver, balance);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory){
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override( ERC721EnumerableUpgradeable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function setBaseURI(string memory newBaseURI) external virtual onlyOwner {
        baseURI = newBaseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

}
