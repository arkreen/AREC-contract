// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

import "../libraries/TransferHelper.sol";

contract PlugMinerAction is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, ERC721EnumerableUpgradeable {

    // keccak256("ActionPlugMiner(address txid,(address owner,address tokenPay,uint256 amountPay,address tokenGet,uint256 amountGet,uint256 action),uint256 nonce,uint256 deadline)");
    bytes32 public constant  ACTION_PLUG = 0x8C1F63E6022B73295566B3EC21F104F6099A29983397FF002493958C93413150;

    struct ActionInfo {
        address owner; 	
        address tokenPay; 	
        uint256 amountPay;
        address tokenGet;
        uint256 amountGet;
        uint256 action;         // Byte 0: 1, Mint, 2, Burn;  
    }  

    struct Sig {
        uint8       v;
        bytes32     r;
        bytes32     s;              
    }

    bytes32 public _DOMAIN_SEPARATOR;
    address public nativeToken;
    address public manager;
    address public fundReceiver;

    // Mapping from payment token address to the total received amount
    // Bytes 0-15: total received amount; Bytes 16-31: all amount available for withdrawing
    mapping(address => uint256) receiveInfo;                

    // Mapping from send-out token address to the total sent amount
    // Bytes 0-15: total deposit amount; Bytes 16-31: total sent amount
    mapping(address => uint256) sendInfo; 

    // Mapping from plug miner NFT ID to the NFT status: 0, normal, 1, onboarded, 2, burned
    mapping(uint256 => uint256) statusPlugMiner; 

    // Mapping from user address to user's nonce
    mapping(address => uint256) nonces; 
    
    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "Deadline Expired!");
        _;
    }

    event ActionPlugMiner(address indexed txid, address indexed user, uint256 action, uint256 number);
    event Deposit(address indexed token, uint256 amount);
    event Remove(address indexed token, uint256 amount);
    event Withdraw(address indexed token, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _native, address _manager, address _receiver) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();     
        __ReentrancyGuard_init();   
        nativeToken = _native;
        manager = _manager;
        fundReceiver = _receiver;

        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes("Plug Miner Action")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );  
    }   

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function changeManager(address newManager) external onlyOwner {
        require(newManager != address(0), "Wrong manager address");
        manager = newManager;
    }

    function changeReceiver(address newReceiver) external onlyOwner {
        require(newReceiver != address(0), "Wrong receiver address");
        fundReceiver = newReceiver;
    }

    function actionPlugMiner(address txid, ActionInfo calldata actionInfo, uint256 nonce, uint256 deadline, Sig calldata signature)
            payable external nonReentrant ensure(deadline) {
        {
            bytes32 offsetHash = keccak256(abi.encode(ACTION_PLUG, txid, actionInfo, nonce, deadline));
            bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, offsetHash));
            address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);

            require(managerAddress == manager, "Wrong Signature");
        }

        require (nonces[msg.sender] == nonce, "Wrong Nonce");
        require (actionInfo.owner == msg.sender, "Wrong Sender");         // Control temporarily in this way

        if (actionInfo.tokenPay != address(0)) {
            if (actionInfo.tokenPay == nativeToken) {
                require (actionInfo.amountPay == msg.value, "Pay low!");
            } else {
                TransferHelper.safeTransferFrom(actionInfo.tokenPay, msg.sender, address(this), actionInfo.amountPay);
            }
        }

        receiveInfo[actionInfo.tokenPay] += (actionInfo.amountPay << 128) + actionInfo.amountPay;   // add two amounts

        if (actionInfo.tokenGet != address(0)) {
            if (actionInfo.tokenPay == nativeToken) {
                TransferHelper.safeTransferETH(msg.sender, actionInfo.amountGet);
            }
            else {
                TransferHelper.safeTransfer(actionInfo.tokenGet, msg.sender, actionInfo.amountGet);
            }
        }

        sendInfo[actionInfo.tokenGet] += actionInfo.amountGet;

        uint256 action = (actionInfo.action >> 248);                     // get the action type
        uint256 number = uint256((uint8)(actionInfo.action >> 240));     // get the NFT number
        if (number == 0) number =1;

        if (action == 1) {
            uint256 tokenId = totalSupply() + 1;
            while (number > 0) {
                _safeMint(actionInfo.owner, tokenId);
                tokenId += 1;
                number -= 1;
            }
        } else if (action == 2) {
            uint256 idPlug = actionInfo.action;
            while (number > 0) {
                uint32 tokenId = uint32(idPlug);
                require (tokenId != 0 , "Wrong ID.");
                require (statusPlugMiner[tokenId] == 0 , "Pay back not allowed." );
                statusPlugMiner[tokenId] = 2;
                idPlug = (idPlug >> 32);
                number -= 1;
            }
        } else {
          revert("Wrong Action!");
        }

        emit ActionPlugMiner(txid, actionInfo.owner, action, number);
    }

    /**
     * @dev Deposit tokens to the contact for sales reward
     * @param token The address of the token to deposit. 
     * @param amount Amount of the token to deposit.
     */
    function depositToken(address token, uint256 amount) external {
        sendInfo[token] += (amount << 128);
        //require(IERC20Upgradeable(token).transferFrom(msg.sender, address(this), amount));
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), amount);
        emit Deposit(token, amount);
    }

    /**
     * @dev Deposit tokens to the contact for sales reward
     * @param token The address of the token to deposit. 
     * @param amount Amount of the token to deposit.
     */
    function removeDeposit(address token, uint256 amount) external onlyOwner {
        //require(IERC20Upgradeable(token).transfer(fundReceiver, amount));
        TransferHelper.safeTransfer(token, fundReceiver, amount);

        sendInfo[token] -= (amount << 128);
        emit Remove(token, amount);
    }

    /**
     * @dev Withdraw sales income
     * @param token Address of the token to withdraw
     */
    function withdraw(address token, uint256 amount) external onlyOwner {
        if (token == nativeToken) {
            TransferHelper.safeTransferETH(fundReceiver, amount);
        }    
        else {
            TransferHelper.safeTransfer(token, fundReceiver, amount);
        }
        receiveInfo[token] -= amount;
        emit Withdraw(token, amount);    
    }
}