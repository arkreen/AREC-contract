import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
const {ethers, upgrades} =  require("hardhat");
import hre from 'hardhat'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { getGreenPowerStakingDigest, getApprovalDigest, expandTo6Decimals, expandTo18Decimals, randomAddresses, expandTo9Decimals } from '../utils/utilities'
import { PlugActionInfo, OffsetActionBatch, getPlugActionInfoHash } from '../utils/utilities'

import { constants, BigNumber, utils} from 'ethers'
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

import {
    ArkreenToken,
    ArkreenMiner,
    ArkreenRECIssuance,
    ArkreenRECIssuanceExt,
    ArkreenRegistry,
    ArkreenRECToken,
    ArkreenBadge,
    ArkreenBuilder,
    ArkreenRECBank,
    WETH9,
    ERC20F,
    PlugMinerAction,
    ArkreenToken__factory,
    ArkreenTokenTest__factory
    // ArkreenTokenV2,
    // ArkreenTokenV2__factory
} from "../../typechain";

import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../../typechain/contracts/ArkreenRECIssuance";
import Decimal from "decimal.js";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { any } from "hardhat/internal/core/params/argumentTypes";
const constants_MaxDealine = BigNumber.from('0xFFFFFFFF')

interface OffsetServerEvent {
  txid:               string
  offsetBaseIndex:    BigNumber
  totalOffsetAmount:  BigNumber
  offsetActionBatch:   OffsetActionBatch[]
}

enum SkipReason {
  NORMAL,
  WRONG_OWNER,
  WRONG_AMOUNT,
  LESS_DEPOSIT
}

describe("GreenPower Test Campaign", ()=>{

    let deployer: SignerWithAddress;
    let manager: SignerWithAddress;
    let register_authority: SignerWithAddress;
    let fund_receiver: SignerWithAddress;

    let owner1: SignerWithAddress;
    let maker1: SignerWithAddress;
    let user1:  SignerWithAddress
    let user2:  SignerWithAddress
    let user3:  SignerWithAddress

    let privateKeyManager:      string
    let privateKeyRegister:     string
    let privateKeyOwner:        string
    let privateKeyMaker:        string

    let AKREToken:                    ArkreenToken
    let arkreenMiner:                 ArkreenMiner
    let arkreenRegistry:              ArkreenRegistry
    let arkreenRECIssuance:           ArkreenRECIssuance
    let arkreenRECIssuanceExt:        ArkreenRECIssuanceExt

    let arkreenRECToken:              ArkreenRECToken
    let arkreenRetirement:            ArkreenBadge
    let arkreenBuilder:               ArkreenBuilder
    let arkreenRECBank:               ArkreenRECBank

    let WETH:                         WETH9
    let tokenA:                       ERC20F
    let plugMinerAction:              PlugMinerAction

    const value10000 = BigNumber.from(10000).mul(256).add(18)     // 10000 AKRE
    const value1000 = BigNumber.from(1000).mul(256).add(18)       // 10000 AKRE
    const value100 = BigNumber.from(100).mul(256).add(18)         // 10000 AKRE

    const value50000 = BigNumber.from(50000).mul(256).add(18)     // 50000 AKRE
    const value5000 = BigNumber.from(5000).mul(256).add(18)       // 5000 AKRE
    const value500 = BigNumber.from(500).mul(256).add(18)         // 500 AKRE

    const Bytes32_Zero = "0x0000000000000000000000000000000000000000000000000000000000000000"

    async function deployFixture() {
        const AKRETokenFactory = await ethers.getContractFactory("ArkreenToken");
        const AKREToken = await upgrades.deployProxy(AKRETokenFactory, [10_000_000_000, deployer.address,'','']) as ArkreenToken
        await AKREToken.deployed();
  
        const ArkreenMinerFactory = await ethers.getContractFactory("ArkreenMiner")
        const arkreenMiner = await upgrades.deployProxy(ArkreenMinerFactory,
                                          [AKREToken.address, AKREToken.address, manager.address, register_authority.address]) as ArkreenMiner
        await arkreenMiner.deployed()
   
        const ArkreenRegistryFactory = await ethers.getContractFactory("ArkreenRegistry")
        const arkreenRegistry = await upgrades.deployProxy(ArkreenRegistryFactory,[]) as ArkreenRegistry
        await arkreenRegistry.deployed()
  
        const ArkreenRECIssuanceFactory = await ethers.getContractFactory("ArkreenRECIssuance")
        const arkreenRECIssuance = await upgrades.deployProxy(ArkreenRECIssuanceFactory, 
                                    [AKREToken.address, arkreenRegistry.address]) as ArkreenRECIssuance
        await arkreenRECIssuance.deployed()
  
        const ArkreenRECIssuanceExtFactory = await ethers.getContractFactory("ArkreenRECIssuanceExt")
        const arkreenRECIssuanceExtImp = await ArkreenRECIssuanceExtFactory.deploy()
        await arkreenRECIssuanceExtImp.deployed()    
        
        await arkreenRECIssuance.setESGExtAddress(arkreenRECIssuanceExtImp.address)
  
        const ArkreenRECTokenFactory = await ethers.getContractFactory("ArkreenRECToken")
        const arkreenRECToken = await upgrades.deployProxy(ArkreenRECTokenFactory,[arkreenRegistry.address, manager.address,'','']) as ArkreenRECToken
        await arkreenRECToken.deployed()   
  
        const ArkreenRetirementFactory = await ethers.getContractFactory("ArkreenBadge")
        const arkreenRetirement = await upgrades.deployProxy(ArkreenRetirementFactory,[arkreenRegistry.address]) as ArkreenBadge
        await arkreenRetirement.deployed()     
  
        const ERC20Factory = await ethers.getContractFactory("ERC20F");
        const tokenA = await ERC20Factory.deploy(expandTo18Decimals(100000000),"Token A");
        await tokenA.deployed();
  
        const WETH9Factory = await ethers.getContractFactory("WETH9");
        const WETH = await WETH9Factory.deploy();
        await WETH.deployed();
  
        const ArkreenRECBankFactory = await ethers.getContractFactory("ArkreenRECBank")
        const arkreenRECBank = await upgrades.deployProxy(ArkreenRECBankFactory,[WETH.address]) as ArkreenRECBank
        await arkreenRECBank.deployed()   
    
        await AKREToken.transfer(owner1.address, expandTo18Decimals(300_000_000))
        await AKREToken.connect(owner1).approve(arkreenRECIssuance.address, expandTo18Decimals(300_000_000))
        await AKREToken.transfer(maker1.address, expandTo18Decimals(300_000_000))
        await AKREToken.connect(maker1).approve(arkreenRECIssuance.address, expandTo18Decimals(300_000_000))
        await AKREToken.connect(owner1).approve(arkreenMiner.address, expandTo18Decimals(300_000_000))
        await AKREToken.connect(maker1).approve(arkreenMiner.address, expandTo18Decimals(300_000_000))
  
        const miners = randomAddresses(2)
        await arkreenMiner.connect(manager).RemoteMinerOnboardInBatch([owner1.address, maker1.address], miners)
  
        const payer = maker1.address
        const Miner_Manager = 0 
        await arkreenMiner.setManager(Miner_Manager, manager.address)
        await arkreenMiner.ManageManufactures([payer], true)     
  
        await arkreenRegistry.addRECIssuer(manager.address, arkreenRECToken.address, "Arkreen Issuer")
        await arkreenRegistry.setRECIssuance(arkreenRECIssuance.address)
        await arkreenRegistry.setArkreenRetirement(arkreenRetirement.address)
   
        const PlugMinerActionFactory = await ethers.getContractFactory("PlugMinerAction")
        const plugMinerAction = await upgrades.deployProxy(PlugMinerActionFactory, [AKREToken.address, manager.address, fund_receiver.address]) as PlugMinerAction
        await plugMinerAction.deployed()
       
        return { AKREToken, arkreenMiner, arkreenRegistry, arkreenRECIssuance, arkreenRECToken, 
          arkreenRetirement, arkreenRECIssuanceExt, arkreenRECBank, WETH, tokenA,
          plugMinerAction }
    }

    describe('PlugMinerAction test', () => {

      beforeEach(async () => {

        [deployer, manager, register_authority, fund_receiver, owner1, user1, user2, user3, maker1] = await ethers.getSigners();

        privateKeyManager = process.env.MANAGER_TEST_PRIVATE_KEY as string
        privateKeyRegister = process.env.REGISTER_TEST_PRIVATE_KEY as string
        privateKeyOwner = process.env.OWNER_TEST_PRIVATE_KEY as string
        privateKeyMaker = process.env.MAKER_TEST_PRIVATE_KEY as string
    
        const fixture = await loadFixture(deployFixture)
        AKREToken = fixture.AKREToken
        arkreenMiner = fixture.arkreenMiner        
        arkreenRegistry = fixture.arkreenRegistry
        arkreenRECIssuance = fixture.arkreenRECIssuance
        arkreenRECIssuanceExt = fixture.arkreenRECIssuanceExt
        arkreenRECToken = fixture.arkreenRECToken
        arkreenRetirement = fixture.arkreenRetirement
        arkreenRECToken = fixture.arkreenRECToken
        arkreenRECBank = fixture.arkreenRECBank
        WETH = fixture.WETH
        tokenA = fixture.tokenA
        plugMinerAction = fixture.plugMinerAction

        {
          const startTime = 1564888526
          const endTime   = 1654888526
          
          let recMintRequest: RECRequestStruct = { 
            issuer: manager.address, startTime, endTime,
            amountREC: expandTo9Decimals(50000), 
            cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte",
            region: 'Beijing',
            url:"", memo:""
          } 

          const mintFee = expandTo18Decimals(50000* 1000)
          const nonce1 = await AKREToken.nonces(owner1.address)
          const digest1 = await getApprovalDigest(
                                  AKREToken,
                                  { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                  nonce1,
                                  constants_MaxDealine
                                )
          const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
          const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants_MaxDealine } 
          
          const price0:BigNumber = expandTo18Decimals(1000).div(expandTo9Decimals(1))
          await arkreenRECIssuance.updateARECMintPrice(AKREToken.address, price0)

          // Mint
          await arkreenRegistry.setArkreenMiner(arkreenMiner.address)
          await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
          const tokenID = await arkreenRECIssuance.totalSupply()

          await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

          // Normal
          await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)

          await arkreenRECToken.connect(owner1).transfer(maker1.address, expandTo9Decimals(9000))
          await arkreenRECToken.connect(maker1).approve(arkreenRECBank.address, expandTo9Decimals(9000))

          await arkreenRECBank.addNewART( arkreenRECToken.address,  maker1.address)
          await arkreenRECBank.connect(maker1).depositART( arkreenRECToken.address,  expandTo9Decimals(9000))
        }

        await AKREToken.connect(user1).approve(plugMinerAction.address, constants.MaxUint256)
        await AKREToken.connect(user2).approve(plugMinerAction.address, constants.MaxUint256)
        await AKREToken.connect(user3).approve(plugMinerAction.address, constants.MaxUint256)

      });
     
      it("plugMinerAction getRewardRate Test", async function () {
        // Normal
        await AKREToken.transfer(user1.address, expandTo18Decimals(100_000_000))
        await AKREToken.transfer(user2.address, expandTo18Decimals(100_000_000))
        await AKREToken.transfer(user3.address, expandTo18Decimals(100_000_000))

        let plugActionInfo: PlugActionInfo = {
          owner:          user1.address,
          tokenPay:       AKREToken.address,              // Used as USDC
          amountPay:      expandTo18Decimals(99),
          tokenGet:       arkreenRECToken.address,
          amountGet:      expandTo18Decimals(1),
          action:         BigNumber.from(1).shl(255)
        }

        const txid = randomAddresses(1)[0]
        const nonce = BigNumber.from(0)

        const digest = getPlugActionInfoHash(
            'Plug Miner Action',
            plugMinerAction.address,
            txid,
            plugActionInfo,
            nonce,
            constants.MaxUint256
        )

        await arkreenRECToken.connect(owner1).transfer(user1.address, expandTo9Decimals(10000))
        await AKREToken.transfer(user1.address, expandTo18Decimals(1_000_000))

        await AKREToken.connect(user1).approve(plugMinerAction.address, constants.MaxUint256)
        await arkreenRECToken.connect(user1).approve(plugMinerAction.address, constants.MaxUint256)
        
        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   
        const signature: PlugMinerAction.SigStruct = { v, r, s }  

        await plugMinerAction.connect(user1).actionPlugMiner(txid, plugActionInfo, nonce, constants.MaxUint256, signature)

      })
  })
})