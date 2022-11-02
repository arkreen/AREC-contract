// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
//import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
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
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;

    // Public variables
    string public constant NAME = 'Arkreen Miner';
    string public constant SYMBOL = 'AKREN';

    address public tokenAKRE;                       // Token adddress of AKRE
    uint256 public totalGameMiner;                  // Total amount of game miner
    uint256 public capGameMinerAirdrop;             // Total amount of game miner that can airdropped
    uint256 public counterGameMinerAirdrop;         // counter of game miner that can airdropped
    uint256 public indexGameMinerWithdraw;          // start index withdrawing the pending game miner

    // Enumerable All airdropped game tokens still in Pending status
    EnumerableSetUpgradeable.UintSet private allPendingGameMiners;

    // All registered miner manufactures
    mapping(address => bool) public AllManufactures;

    // Timestamp indicating Arkreen normal launch state 
    uint256 public timestampFormalLaunch;
    
    // All miner infos
    mapping(uint256 => Miner) public AllMinerInfo;

    // All managers with various privilege
    mapping(uint256 => address) public AllManagers;
     
    bytes32 public DOMAIN_SEPARATOR;

    // Mapping from miner address to the respective token ID
    mapping(address => uint256) public AllMinersToken;

    string public baseURI;

    // Constants
    // keccak256("GameMinerOnboard(address owner,address miners,bool bAirDrop,uint256 deadline)");
    bytes32 public constant GAME_MINER_TYPEHASH = 0xB0C08E369CF9D149F7E973AF789B8C94B7DA6DCC0A8B1F5F10F1820FB6224C11;  
    uint256 public constant DURATION_ACTIVATE = 3600 * 24 * 30;    // Game miner needs to be activated with 1 month
    uint256 public constant INIT_CAP_AIRDROP = 10000;              // Cap of Game miner airdrop

    // Events
    event GameMinerAirdropped(uint256 timestamp, uint256 amount);
    event GameMinerOnboarded(address indexed owner, address[] miners);
    event MinerOnboarded(address indexed owner, address indexed miner);
    event VitualMinersInBatch(address[] owners, address[] miners);
    
    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, 'Arkreen Miner: EXPIRED');
        _;
    }

    modifier isGamingPhase() {
        require(block.timestamp < timestampFormalLaunch, 'Arkreen Miner: Gaming Phase Ended');
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

    function initialize(address _tokenAKRE, address _minerManager, address _minerAuthority)
        external
        virtual
        initializer
    {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();
        __ERC721_init_unchained(NAME, SYMBOL);
        tokenAKRE = _tokenAKRE;
        AllManagers[uint256(MinerManagerType.Miner_Manager)] = _minerManager;
        AllManagers[uint256(MinerManagerType.Register_Authority)] = _minerAuthority;
        timestampFormalLaunch = type(uint64).max;    // To flag in gaming phase
        capGameMinerAirdrop = INIT_CAP_AIRDROP;
        baseURI = 'https://www.arkreen.com/miners/';

//        address owner = _msgSender();
//        assembly {
//            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, owner)
//        }        

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

    function postUpdate(
        address _tokenAKRE, 
        address _minerManager
    ) external onlyProxy onlyOwner {
        tokenAKRE = _tokenAKRE;
        AllManagers[uint256(MinerManagerType.Miner_Manager)] = _minerManager;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
        onlyOwner
    {}

    /**
     * @dev Mint game miners to the user who has just ordered some mining virtual/DTU Miners. 
     * @param receiver address receiving the game miner tokens
     * @param miners address of the game miners    
     */
    function OrderMiners(
        address receiver,
        address[] memory miners,
        Signature calldata permitToPay
    ) external onlyMinerManager {

        // Permit payment
        IERC20Permit(permitToPay.token).permit(receiver, address(this), 
                                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Game miner only can be minted before the time of formal lauch date
        if (block.timestamp < (timestampFormalLaunch)) {
            require(miners.length != 0, 'Arkreen Miner: Null Game Miner');

            // Default miner info
            Miner memory tmpMiner;
            tmpMiner.mType = MinerType.GameMiner;
            tmpMiner.mStatus = MinerStatus.Normal;
            tmpMiner.timestamp = uint32(block.timestamp);

            //slither-disable-next-line uninitialized-local
            for(uint256 index; index < miners.length; index++) {
                // Mint game miner one by one
                tmpMiner.mAddress = miners[index];
                require(AllMinersToken[tmpMiner.mAddress] == 0, "Arkreen Miner: Miner Repeated");
                uint256 gMinerID = totalSupply() + 1 ;               
                _safeMint(receiver, gMinerID);
                AllMinersToken[tmpMiner.mAddress] = gMinerID;
                AllMinerInfo[gMinerID] = tmpMiner;

                // increase the counter of total game miner 
                totalGameMiner += 1;        
            }

            // emit the game minting event
            emit GameMinerOnboarded(receiver,  miners);
        } else {
            require(miners.length == 0, 'Arkreen Miner: Game Miner Not Allowed');
        }
        
        // Transfer onboarding fee
        TransferHelper.safeTransferFrom(permitToPay.token, receiver, address(this), permitToPay.value);
    }

    /**
     * @dev Airdrop game miners to the users
     * @param receivers address receiving the game miner tokens
     * @param miners address of the airdropped game miners. If miners is null,
     * withdraw the pending game miners and send to the new receivers
     */
    function AirdropMiners(
        address[] memory receivers,
        address[] memory miners
    ) external isGamingPhase onlyOwner {

        if(miners.length == 0) {
            // Re-airdrop pending game miners to new receivers 
            require(counterGameMinerAirdrop >= capGameMinerAirdrop, 'Game Miner: Airdrop Not Full'); 
            require(receivers.length <= allPendingGameMiners.length(), 'Game Miner: Two Much Airdrop Receiver'); 

            // Start from last ended position
            uint256 withdrawFrom = indexGameMinerWithdraw;

            // Counter to protect against endless loop
            uint256 counterHandled = 0;

            uint256 tokenIDWithdraw;
            for(uint256 index = 0; index < receivers.length; index++) {
                while(true) {
                    // Wrap to head if overflowed due to game miner onboarded
                    if(withdrawFrom >= allPendingGameMiners.length()) {
                        withdrawFrom = 0;
                    }  

                    // Check if the claim deadline is passed
                    tokenIDWithdraw = allPendingGameMiners.at(withdrawFrom);
                    if( block.timestamp >= AllMinerInfo[tokenIDWithdraw].timestamp) {
                        break;
                    }

                    // skip to next game miner
                    withdrawFrom += 1;
                    counterHandled += 1;
                    require(counterHandled < allPendingGameMiners.length(), 'Game Miner: Two Much Airdrop');                     
                }

                // Check the receiver to avoid repeating airdrop
                address owner = receivers[index];
                require( !owner.isContract(), 'Game Miner: Only EOA Address Allowed' );
                require( balanceOf(owner) == 0, 'Game Miner: Airdrop Repeated' );

                // Withdraw the pending game miner, and transfer to the new receiver
                address ownerOld = ownerOf(tokenIDWithdraw);

                _transfer(ownerOld, owner, tokenIDWithdraw);

                // Update the new deadline to the claimed game miner
                AllMinerInfo[tokenIDWithdraw].timestamp = uint32(block.timestamp + DURATION_ACTIVATE);

                // pointer to next pending game miner
                withdrawFrom += 1;
            }

            // Save the new index for the next time airdrop
            indexGameMinerWithdraw = withdrawFrom;

        } else {
            // Fresh airdrop
            require(receivers.length == miners.length, 'Game Miner: Wrong Input'); 
            require((counterGameMinerAirdrop + receivers.length) <= capGameMinerAirdrop, 'Game Miner: Airdrop Overflowed'); 

            // Default airdropped game miner info
            Miner memory miner;
            miner.mType = MinerType.GameMiner;
            miner.mStatus = MinerStatus.Pending;
            miner.timestamp = uint32(block.timestamp + DURATION_ACTIVATE);
            
            for(uint256 index; index < receivers.length; index++) {
                // Check the receiver to avoid repeating airdrop
                address owner = receivers[index];
                require( !owner.isContract(), 'Game Miner: Only EOA Address Allowed' );
                require( balanceOf(owner) == 0, 'Game Miner: Airdrop Repeated' );

                uint256 gMinerID = totalSupply() + 1;        
                _safeMint(owner, gMinerID);
                miner.mAddress = miners[index];
                AllMinersToken[miner.mAddress] = gMinerID;
                AllMinerInfo[gMinerID] = miner;

                // increase the counter of total game miner 
                totalGameMiner += 1;

                // Add to the pending airdrop set
                allPendingGameMiners.add(gMinerID);
                counterGameMinerAirdrop += 1;
            }
        }

        emit GameMinerAirdropped(block.timestamp, receivers.length);
    }

    /**
     * @dev Onboarding game miner, an airdropped one, or a new applied one.
     * @param owner address receiving the game miner
     * @param miner address of the game miner onboarding
     * @param bAirDrop flag if the game miner is airdropped before,
     * bAirDrop =1, onboard the airdropped game miner, =0, onboard a new game miner
     * @param permitGameMiner signature of onboarding manager to approve the onboarding
     */
    function GameMinerOnboard(
        address owner,
        address miner,
        bool    bAirDrop,
        uint256 deadline,
        SigRegister calldata permitGameMiner
    ) external ensure(deadline) isGamingPhase {
        // Miner onboarding must be EOA address 
        require(!miner.isContract(), 'Game Miner: Not EOA Address');

        // Check signature
        bytes32 hashRegister = keccak256(abi.encode(GAME_MINER_TYPEHASH, owner, miner, bAirDrop, deadline));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR, hashRegister));
        address recoveredAddress = ecrecover(digest, permitGameMiner.v, permitGameMiner.r, permitGameMiner.s);
  
        require(recoveredAddress != address(0) && 
                recoveredAddress == AllManagers[uint256(MinerManagerType.Register_Authority)], 'Game Miner: INVALID_SIGNATURE');

        Miner memory tmpMiner;
        tmpMiner.mAddress = miner;
        tmpMiner.mType = MinerType.GameMiner;
        tmpMiner.mStatus = MinerStatus.Normal;
        tmpMiner.timestamp = uint32(block.timestamp);        

        if(bAirDrop) {
            // Boarding an airdropped game miner
            uint256 pendingMinerID = getPendingMiner(owner);            // Can only have one pending game miner       
            require(pendingMinerID != type(uint256).max, "Game Miner: No Miner To Board"); 
            require(miner == AllMinerInfo[pendingMinerID].mAddress, "Game Miner: Wrong Miner Address"); 
            AllMinerInfo[pendingMinerID] = tmpMiner;
            allPendingGameMiners.remove(pendingMinerID);

        } else {
            // Boading a new applied game miner
            require(bAllowedToMintGameMiner(owner), 'Game Miner: Holding Game Miner');
            require(AllMinersToken[miner] == 0, "Game Miner: Miner Repeated");
            uint256 gMinerID = totalSupply() + 1;
            _safeMint(owner, gMinerID);
            AllMinersToken[tmpMiner.mAddress] = gMinerID;
            AllMinerInfo[gMinerID] = tmpMiner;

            // Increase the counter of total game miner 
            totalGameMiner += 1;       
        }

        // emit onboarding event
        address[] memory tempMiner = new address[](1);
        tempMiner[0] = miner;
        emit GameMinerOnboarded(owner,  tempMiner);
    }

    /**
     * @dev Onboarding a virtual Miner or DTU miner.
     * @param owner address receiving the virtual/DTU miner
     * @param miner address of the virtual/DTU miner onboarding
     * @param gameMiner address of the game miner to mint, may be unset after gaming stopped
     * @param minerType type of the onboarding virtual Miner or DTU miner
     * @param payer address of the payer paying the onboarding fee     
     * @param permitToPay signature of payer to pay the onboarding fee
     */
    function MinerOnboard(
        address     owner,
        address     miner,
        address     gameMiner,
        MinerType   minerType,
        address     payer,
        Signature memory permitToPay
    ) external ensure(permitToPay.deadline) onlyMinerManager {
        // Payer being ether the owner or the registered manufacturer. (Miner Manager should also be registered)
        require((payer == owner) || AllManufactures[payer], 'Arkreen Miner: Not Payer Nor Registered');

        // Miner onboarding must be an EOA address 
        require( miner != address(0) && !miner.isContract(), 'Arkreen Miner: Must Be EOA Address');

        // New miner cannot be game miner
        require(minerType != MinerType.GameMiner, 'Arkreen Miner: Cannot Be Game Miner');

        // Permit payment
        IERC20Permit(permitToPay.token).permit(payer, address(this), 
                                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Prepare to mint new virtual/DTU miner
        Miner memory newMiner;
        newMiner.mAddress = miner;
        newMiner.mType = minerType;
        newMiner.mStatus = MinerStatus.Normal;
        newMiner.timestamp = uint32(block.timestamp);    

        // mint new virtual/DTU miner
        uint256 realMinerID = totalSupply() + 1;
        _safeMint(owner, realMinerID);
        AllMinersToken[newMiner.mAddress] = realMinerID;
        AllMinerInfo[realMinerID] = newMiner;

        // Game miner can be minted before the formal launch
        if (block.timestamp < (timestampFormalLaunch)) {            
            // Check if need to mint a new game miner, the user may applied the game miner beforehand by oneself 
            if(bAllowedToMintGameMiner(owner)) {
                require(gameMiner != address(0), 'Arkreen Miner: Zero Game Miner Address');
                require(AllMinersToken[gameMiner] == 0, "Arkreen Miner: Miner Repeated");
                // Boading a new applied game miner
                newMiner.mAddress = gameMiner;
                newMiner.mType = MinerType.GameMiner;
                uint256 gMinerID = totalSupply() + 1;
                _safeMint(owner, gMinerID);
                AllMinersToken[newMiner.mAddress] = gMinerID;
                AllMinerInfo[gMinerID] = newMiner;

                // emit onboarding event
                address[] memory tempMiner = new address[](1);
                tempMiner[0] = gameMiner;
                emit GameMinerOnboarded(owner,  tempMiner);

                // Increase the counter of total game miner 
                totalGameMiner += 1;       
            } else {
                require(gameMiner == address(0), 'Arkreen Miner: Too More Game Miner');
            }
        } else {
            require(gameMiner == address(0), 'Arkreen Miner: Game Miner Not Allowed');
        }

        // Transfer onboarding fee
        TransferHelper.safeTransferFrom(permitToPay.token, payer, address(this), permitToPay.value);

        emit MinerOnboarded(owner, miner);
    }

    /**
     * @dev Onboarding virtual miners in batch
     * @param owners addresses receiving the virtual miners
     * @param miners addresses of the virtual miners onboarding
     */
    function VirtualMinerOnboardInBatch(
        address[]  calldata   owners,
        address[]  calldata   miners
    ) external isGamingPhase onlyMinerManager {

        require(owners.length == miners.length, 'Arkreen Miner: Wrong Address List');

        // Prepare to mint new virtual miners, only virtual miners
        Miner memory newMiner;
        newMiner.mType = MinerType.virtualMiner;
        newMiner.mStatus = MinerStatus.Normal;
        newMiner.timestamp = uint32(block.timestamp);

        for(uint256 index; index < owners.length; index++) {
            // Mint new virtual miners one by one
            uint256 virtualMinerID = totalSupply() + 1;
            newMiner.mAddress = miners[index];
            _safeMint(owners[index], virtualMinerID);
            AllMinersToken[newMiner.mAddress] = virtualMinerID;            
            AllMinerInfo[virtualMinerID] = newMiner;
        }
        // Need to emit? If yes, data may be big 
        emit VitualMinersInBatch(owners, miners);
    }

    /**
     * @dev Hook that is called before any token transfer. Miner Info is checked as the following rules:  
     * A) Game miner cannot be transferred
     * B) Only miner in Normal state can be transferred
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override (ERC721EnumerableUpgradeable) {
        // Game miner cannot be transferred, not including mint and burn
        // But contract owner can withdram and re-airdrop game miner 
        if(_msgSender() != owner()) {
          if (from != address(0) && to != address(0)){
              Miner memory miner = AllMinerInfo[tokenId];
              require(miner.mType != MinerType.GameMiner, 'Arkreen Miner: Game Miner Transfer Not Allowed');
              require(miner.mStatus == MinerStatus.Pending, 'Arkreen Miner: Miner Status Not Transferrable');
          }
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Get the Pending game miner ID of the specified owner
     * @param owner owner address
     */
    function getPendingMiner(address owner) internal view returns (uint256 tokenID) {
        uint256 totalMiners = balanceOf(owner);
        for(uint256 index; index < totalMiners; index++) {     
            uint256 minerID = tokenOfOwnerByIndex(owner, index);
            if(AllMinerInfo[minerID].mType == MinerType.GameMiner && AllMinerInfo[minerID].mStatus == MinerStatus.Pending) {
                return minerID;
            }
        }
        return type(uint256).max;
    }    


        /**
     * @dev Get the running game miner address of the specified owner
     * @param owner owner address
     */
    function getGamingMiners(address owner) external view returns (address[] memory) {
        uint256 totalMiners = balanceOf(owner);
        address[] memory gMiners = new address[](totalMiners);

        uint256 index;
        for(; index < totalMiners; index++) {     
            uint256 minerID = tokenOfOwnerByIndex(owner, index);
            if(AllMinerInfo[minerID].mType == MinerType.GameMiner && AllMinerInfo[minerID].mStatus == MinerStatus.Normal) {
                gMiners[index] = AllMinerInfo[minerID].mAddress;
            }
        }

        // Re-set the array length
        assembly { mstore(gMiners, index) }
        return gMiners;
    }  

    /**
     * @dev Check if allowed to mint a new game miner
     * @param owner owner address
     */
    function bAllowedToMintGameMiner(address owner) internal view returns (bool) {
        uint256 numberGame;
        uint256 numberReal;
        for(uint256 index; index < balanceOf(owner); index++) {     
            uint256 minerID = tokenOfOwnerByIndex(owner, index);
            if(AllMinerInfo[minerID].mStatus == MinerStatus.Normal ) {
                if(AllMinerInfo[minerID].mType == MinerType.GameMiner) {
                    numberGame = numberGame + 1;
                } else {
                    numberReal = numberReal + 1;
                }
            }
        }
        return numberGame <= numberReal;
    }   

    /**
     * @dev Get the token ID of the specified miner 
     * @param owner owner address
     * @param miner miner address to find, if it is zero, return the fisrt found running game miner
     */
    function getMinerTokenID(address owner, address miner) external view returns (uint256 tokenID) {
        uint256 totalMiners = balanceOf(owner);
        for(uint256 index; index < totalMiners; index++) {     
            uint256 minerID = tokenOfOwnerByIndex(owner, index);
            if( AllMinerInfo[minerID].mStatus == MinerStatus.Normal &&
                miner == AllMinerInfo[minerID].mAddress ) {
                return minerID;
            }    
        }
        return type(uint256).max;
    } 

    /**
     * @dev Get all the miner info of the owner
     * @param owner owner address
     */
/*
    function GetMiners(address owner) external view returns (Miner[] memory miners) {
        uint256 totalMiners = balanceOf(owner);
        miners = new Miner[](totalMiners);
        for(uint256 index;  index < totalMiners; index++) {     
            uint256 minerID = tokenOfOwnerByIndex(owner, index);
            miners[index] = AllMinerInfo[minerID];
        }
    }
*/

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
     * @dev Update the cap to airdrop game miners
     * @param newMinerCap new cap to airdrop game miners
     */
    function ChangeAirdropCap(uint256 newMinerCap) external onlyOwner {
        require(newMinerCap >= counterGameMinerAirdrop, 'Arkreen Miner: Cap Is Lower');      
       capGameMinerAirdrop = newMinerCap;
    }    

    /**
     * @dev Set the timestamp of Arkreen network formal launch. 
     */
    function setLaunchTime(uint256 timeLaunch) external onlyOwner {
      require(timeLaunch > block.timestamp, 'Arkreen Miner: Low Timestamp');  
      timestampFormalLaunch = timeLaunch;
    }    

    /**
     * @dev Get the number of all the pending game miners
     */
    function GetPendingGameNumber() external view returns (uint256) {
      return allPendingGameMiners.length();
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
