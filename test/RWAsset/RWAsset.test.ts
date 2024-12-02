import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
const {ethers, upgrades} =  require("hardhat");
import hre from 'hardhat'
import { ecsign, fromRpcSig, ecrecover, zeroAddress } from 'ethereumjs-util'
import { getApprovalDigest, expandTo18Decimals, randomAddresses, expandTo9Decimals } from '../utils/utilities'
import { PlugActionInfo, OffsetActionBatch, getWithdrawDepositDigest } from '../utils/utilities'

import { constants, BigNumber, utils} from 'ethers'

import {
    ArkreenToken,
    USDS,
    RWAsset,
} from "../../typechain";

export interface AssetType {
  typeAsset:            number
  tenure:               number
  remoteQuota:          number
  investQuota:          number
  valuePerInvest:       number
  amountRepayMonthly:   number
  amountRepayPerInvest:  number
  amountDeposit:        number
  numSoldAssets:        number
  investTokenType:      number
  maxInvestOverdue:     number
  minInvestExit:        number
}

export interface GlobalStatus {
  numAssetType:         number
  numAssets:            number
  numCancelled:         number
  numDelivered:         number
  numOnboarded:         number
  numTokenAdded:         number
  numInvest:            number
}

describe("GreenPower Test Campaign", ()=>{

    let deployer: SignerWithAddress;
    let manager: SignerWithAddress;
    let authority: SignerWithAddress;
    let fund_receiver: SignerWithAddress;

    let owner1: SignerWithAddress;
    let maker1: SignerWithAddress;
    let user1:  SignerWithAddress
    let user2:  SignerWithAddress
    let user3:  SignerWithAddress

    let privateKeyManager:      string
    let privateKeyAuthority:     string
    let privateKeyOwner:        string
    let privateKeyMaker:        string

    let AKREToken:              ArkreenToken
    let usdc:                   USDS
    let usdt:                   USDS
    let usdp:                   USDS
    let dai:                    USDS

    let rwAsset:                RWAsset
    let assetType:              AssetType 

    let tokenType = 1
 
    const Bytes32_Zero = "0x0000000000000000000000000000000000000000000000000000000000000000"

    async function deployFixture() {
        const AKRETokenFactory = await ethers.getContractFactory("ArkreenToken");
        const AKREToken = await upgrades.deployProxy(AKRETokenFactory, [10_000_000_000, deployer.address,'','']) as ArkreenToken
        await AKREToken.deployed();
  
        const USDSFactory = await ethers.getContractFactory("USDS");
        const usdc = await upgrades.deployProxy(USDSFactory, [100_000_000, deployer.address,'USDC','usdc']) as ArkreenToken
        await usdc.deployed();

        const usdt = await upgrades.deployProxy(USDSFactory, [100_000_000, deployer.address,'USDT','usdt']) as ArkreenToken
        await usdt.deployed();

        const usdp = await upgrades.deployProxy(USDSFactory, [100_000_000, deployer.address,'USDP','usdp']) as ArkreenToken
        await usdp.deployed();

        const dai = await upgrades.deployProxy(USDSFactory, [100_000_000, deployer.address,'DAI','dai']) as ArkreenToken
        await dai.deployed();

        const RWAssetFactory = await ethers.getContractFactory("RWAsset");
        const rwAsset = await upgrades.deployProxy(RWAssetFactory, [AKREToken.address, authority.address, manager.address]);
        await rwAsset.deployed();
     
        await AKREToken.transfer(owner1.address, expandTo18Decimals(300_000_000))
        await AKREToken.transfer(user1.address, expandTo18Decimals(300_000_000))
         
        return { AKREToken, usdc, usdt, usdp, dai, rwAsset  }

    }

    describe('RWAsset test', () => {

      beforeEach(async () => {

        [deployer, manager, authority, fund_receiver, owner1, user1, user2, user3, maker1] = await ethers.getSigners();

        privateKeyManager = process.env.MANAGER_TEST_PRIVATE_KEY as string
        privateKeyAuthority = process.env.REGISTER_TEST_PRIVATE_KEY as string
        privateKeyOwner = process.env.OWNER_TEST_PRIVATE_KEY as string
        privateKeyMaker = process.env.MAKER_TEST_PRIVATE_KEY as string
    
        const fixture = await loadFixture(deployFixture)
        AKREToken = fixture.AKREToken
        usdc = fixture.usdc
        usdt = fixture.usdt
        usdp = fixture.usdp
        dai = fixture.dai
        rwAsset = fixture.rwAsset

        await AKREToken.connect(owner1).approve(rwAsset.address, constants.MaxUint256)
        await AKREToken.connect(user1).approve(rwAsset.address, constants.MaxUint256)
        await AKREToken.connect(user2).approve(rwAsset.address, constants.MaxUint256)
        await AKREToken.connect(user3).approve(rwAsset.address, constants.MaxUint256)

        assetType = {
          typeAsset:            1,
          tenure:               365,
          remoteQuota:          25,
          investQuota:          800,
          valuePerInvest:       1_000_000,
          amountRepayMonthly:   150_000_000,
          amountRepayPerInvest:  75_000_000,
          amountDeposit:        1_500_000,
          numSoldAssets:        0,
          investTokenType:      1,
          maxInvestOverdue:     15,
          minInvestExit:        7,
        }
      });


      it("RWAsset Test: addNewInvestToken", async function () {
        await expect(rwAsset.addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address]))
                .to.be.revertedWith("RWA: Not manager")

        await expect(rwAsset.connect(manager).addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address]))
                .to.emit(rwAsset, 'AddNewInvestToken')
                .withArgs(tokenType, [usdc.address, usdt.address, usdp.address, dai.address])

        expect(await rwAsset.globalStatus()).to.deep.eq([0, 0, 0, 0, 0, 4, 0]);
        expect(await rwAsset.allInvestTokens(1)).to.deep.eq([1, usdc.address]);
        expect(await rwAsset.allInvestTokens(2)).to.deep.eq([1, usdt.address]);
        expect(await rwAsset.allInvestTokens(3)).to.deep.eq([1, usdp.address]);
        expect(await rwAsset.allInvestTokens(4)).to.deep.eq([1, dai.address]);
      })

      it("RWAsset Test: addNewAssetType", async function () {

        await rwAsset.connect(manager).addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address])
        await expect(rwAsset.connect(manager).addNewAssetType(assetType))
                .to.emit(rwAsset, 'AddNewAssetType')
                .withArgs(Object.values(assetType))

        expect(await rwAsset.assetTypes(1)).to.deep.eq(Object.values(assetType));
        expect(await rwAsset.globalStatus()).to.deep.eq([1, 0, 0, 0, 0, 4, 0]);

        await expect(rwAsset.addNewAssetType(assetType))
                .to.be.revertedWith("RWA: Not manager")

        assetType.typeAsset = 3
        await expect(rwAsset.connect(manager).addNewAssetType(assetType))
                .to.be.revertedWith("RWA: Wrong asset type")
      })

      it("RWAsset Test: depositForAsset", async function () {

        await rwAsset.connect(manager).addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)

        const amountDeposit = expandTo18Decimals(assetType.amountDeposit)
        const balanceBefore = await AKREToken.balanceOf(user1.address)
 
        await expect(rwAsset.connect(user1).depositForAsset(1, 1))
          .to.emit(rwAsset, 'DepositForAsset')
          .withArgs(user1.address, 1, 1, 1, amountDeposit)

        expect(await AKREToken.balanceOf(user1.address)).to.eq(balanceBefore.sub(amountDeposit))

        let assetDetails =  {
          assetOwner:       user1.address,
          status:           1,
          tokenId:          1,
          typeAsset:        1,
          numInvestings:    0,
          numQuotaTotal:    0,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   0,
          onboardTimestamp: 0,
          sumAmountRepaid: 0,
          amountForInvestWithdarw: 0,
          amountInvestWithdarwed: 0
        }
        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));
        expect(await rwAsset.globalStatus()).to.deep.eq([1, 1, 0, 0, 0, 4, 0]);
        expect(await rwAsset.userAssetList(user1.address, 0)).to.deep.eq(1);

        await expect(rwAsset.connect(user1).depositForAsset(3, 1))
            .to.be.revertedWith("RWA: Asset type not defined")
      })

      it("RWAsset Test: withdrawDeposit", async function () {

        await rwAsset.connect(manager).addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)
        await rwAsset.connect(user1).depositForAsset(1, 1)

        const digest = getWithdrawDepositDigest(
                  rwAsset.address,
                  'Arkreen RWA Fund',
                  1,
                  user1.address,
                  expandTo18Decimals(assetType.amountDeposit),
                  constants.MaxUint256
                )

        const signature = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyAuthority.slice(2), 'hex'))
  
        const amountDeposit = expandTo18Decimals(assetType.amountDeposit)
        const balanceBefore = await AKREToken.balanceOf(user1.address)

        await expect(rwAsset.withdrawDeposit(1, constants.MaxUint256, signature))
                .to.be.revertedWith("RWA: Not Owner")
 
        await expect(rwAsset.connect(user1).withdrawDeposit(1, constants.MaxUint256, signature))
                .to.emit(rwAsset, 'WithdrawDeposit')
                .withArgs(user1.address, 1, amountDeposit)

        let assetDetails =  {
          assetOwner:       user1.address,
          status:           2,
          tokenId:          1,
          typeAsset:        1,
          numInvestings:    0,
          numQuotaTotal:    0,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   0,
          onboardTimestamp: 0,
          sumAmountRepaid: 0,
          amountForInvestWithdarw: 0,
          amountInvestWithdarwed: 0
        }
        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));
        expect(await AKREToken.balanceOf(user1.address)).to.eq(balanceBefore.add(amountDeposit))

        await expect(rwAsset.connect(user1).withdrawDeposit(1, constants.MaxUint256, signature))
                  .to.be.revertedWith("RWA: Not allowed")

      })

      it("RWAsset Test: deliverAsset", async function () {

        await rwAsset.connect(manager).addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)
        await rwAsset.connect(user1).depositForAsset(1, 1)

        const deliveryProof = "0x7120dcbcda0d9da55bc291bf4aaee8f691a0dcfbd4ad634017bb6f5686d92d74"     // Just for test

        await expect(rwAsset.connect(user1).deliverAsset(1, deliveryProof))
                .to.be.revertedWith("RWA: Not manager")

        await expect(rwAsset.connect(manager).deliverAsset(1, deliveryProof))
                .to.emit(rwAsset, 'DeliverAsset')
                .withArgs(1, deliveryProof)

        let assetDetails =  {
          assetOwner:       user1.address,
          status:           3,
          tokenId:          1,
          typeAsset:        1,
          numInvestings:     0,
          numQuotaTotal:      0,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   1,
          onboardTimestamp: 0,
          sumAmountRepaid: 0,
          amountForInvestWithdarw: 0,
          amountInvestWithdarwed: 0
        }

        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));
        expect(await rwAsset.deliveryProofList(1)).to.deep.eq(deliveryProof);
        expect(await rwAsset.globalStatus()).to.deep.eq([1, 1, 0, 1, 0, 4, 0]);
       
        await expect(rwAsset.connect(manager).deliverAsset(1, deliveryProof))
                .to.be.revertedWith("RWA: Not allowed")

      })

      it("RWAsset Test: onboardAsset", async function () {

        await rwAsset.connect(manager).addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)
        await rwAsset.connect(user1).depositForAsset(1, 1)

        const deliveryProof = "0x7120dcbcda0d9da55bc291bf4aaee8f691a0dcfbd4ad634017bb6f5686d92d74"     // Just for test
        await rwAsset.connect(manager).deliverAsset(1, deliveryProof)

        await expect(rwAsset.connect(user1).onboardAsset(1))
                .to.be.revertedWith("RWA: Not manager")

        await expect(rwAsset.connect(manager).onboardAsset(1))
                .to.emit(rwAsset, 'OnboardAsset')
                .withArgs(1)

        const lastBlock = await ethers.provider.getBlock('latest')

        let assetDetails =  {
          assetOwner:       user1.address,
          status:           4,
          tokenId:          1,
          typeAsset:        1,
          numInvestings:     0,
          numQuotaTotal:      0,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   1,
          onboardTimestamp: lastBlock.timestamp,
          sumAmountRepaid: 0,
          amountForInvestWithdarw: 0,
          amountInvestWithdarwed: 0
        }

        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));
        expect(await rwAsset.deliveryProofList(1)).to.deep.eq(deliveryProof);
        expect(await rwAsset.globalStatus()).to.deep.eq([1, 1, 0, 1, 1, 4, 0]);
       
        await expect(rwAsset.connect(manager).onboardAsset(1))
                .to.be.revertedWith("RWA: Not allowed")

      })

      it("RWAsset Test: investAsset", async function () {

        await rwAsset.connect(manager).addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)
        await rwAsset.connect(user1).depositForAsset(1, 1)

        // Test case 1:  revert "RWA: Status not allowed" before "Delivered" state
        await expect(rwAsset.investAsset(1, 5))
                .to.be.revertedWith("RWA: Status not allowed")

        const deliveryProof = "0x7120dcbcda0d9da55bc291bf4aaee8f691a0dcfbd4ad634017bb6f5686d92d74"     // Just for test
        await rwAsset.connect(manager).deliverAsset(1, deliveryProof)

        await usdc.approve(rwAsset.address, constants.MaxUint256)

        // Test case: Normal investing
        const amountToken = 150 * (assetType.valuePerInvest)
        const usdcBalanceBefore = await usdc.balanceOf(deployer.address)

        await expect(rwAsset.investAsset(1, 150))
                .to.emit(usdc, 'Transfer')
                .withArgs(deployer.address, rwAsset.address, amountToken)
                .to.emit(rwAsset, 'InvestAsset')
                .withArgs(deployer.address, 1, usdc.address, amountToken)

        expect(await usdc.balanceOf(deployer.address)).to.eq(usdcBalanceBefore.sub(amountToken))

        let assetDetails =  {
          assetOwner:       user1.address,
          status:           3,  //Delivered,
          tokenId:          1,
          typeAsset:        1,
          numInvestings:     1,
          numQuotaTotal:      150,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   1,
          onboardTimestamp: 0,
          sumAmountRepaid: 0,
          amountForInvestWithdarw: 0,
          amountInvestWithdarwed: 0
        }
        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));

        let lastBlock = await ethers.provider.getBlock('latest')
        let investing = {
          invester: deployer.address,
          assetId: 1,
          timestamp: lastBlock.timestamp,
          status: 1,
          numQuota: 150
        }

        let indexInvesting = (1<<16) +1
        expect(await rwAsset.investList(indexInvesting)).to.deep.eq(Object.values(investing));
        
        // test case：second normal investing by owner1 
        await usdc.transfer(owner1.address, 1000 * 1000_000)
        await usdc.connect(owner1).approve(rwAsset.address, constants.MaxUint256)
        await rwAsset.connect(owner1).investAsset(1, 550)
        assetDetails.numInvestings = 2
        assetDetails.numQuotaTotal = 150 + 550
        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));

        lastBlock = await ethers.provider.getBlock('latest')

        investing = {
          invester: owner1.address,
          assetId: 1,
          timestamp: lastBlock.timestamp,
          status: 1,
          numQuota: 550
        }

        indexInvesting = (1<<16) + 2
        expect(await rwAsset.investList(indexInvesting)).to.deep.eq(Object.values(investing));

        expect(await rwAsset.globalStatus()).to.deep.eq([1, 1, 0, 1, 0, 4, 2]);

        // test case： RWA: Invest overflowed
        await expect(rwAsset.investAsset(1, 150))
                .to.be.revertedWith("RWA: Invest overflowed")

        // test case: Investing is still on-goling after asset is onboarded.
        await rwAsset.connect(manager).onboardAsset(1)
        lastBlock = await ethers.provider.getBlock('latest')

        await rwAsset.investAsset(1, 15)
        
        assetDetails.status = 4
        assetDetails.numInvestings = 3
        assetDetails.numQuotaTotal = 150 + 550 + 15
        assetDetails.onboardTimestamp = lastBlock.timestamp
        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));

        await ethers.provider.send("evm_increaseTime", [assetType.maxInvestOverdue * 3600 * 24])
        await expect(rwAsset.investAsset(1, 15))
                .to.be.revertedWith("RWA: Invest overdued")
                  
  //      // test case: All quotas are invested.
  //      await rwAsset.investAsset(1, 85)
  //
  //      assetDetails.numInvestings = 4
  //      assetDetails.numQuotaTotal = 150 + 550 + 15 + 85
  //      expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));
      })

      it("RWAsset Test: investExit", async function () {

        await rwAsset.connect(manager).addNewInvestToken(tokenType, [usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)
        await rwAsset.connect(user1).depositForAsset(1, 1)

        const deliveryProof = "0x7120dcbcda0d9da55bc291bf4aaee8f691a0dcfbd4ad634017bb6f5686d92d74"     // Just for test
        await rwAsset.connect(manager).deliverAsset(1, deliveryProof)

        await usdc.approve(rwAsset.address, constants.MaxUint256)

        const amountToken = 150 * (assetType.valuePerInvest)
        await rwAsset.investAsset(1, 150)

        let lastBlock = await ethers.provider.getBlock('latest')

        let indexInvesting = (1<<16) + 1

        // Abnormal Test case: Not owner
        await expect(rwAsset.connect(owner1).investExit(indexInvesting))
                .to.be.revertedWith("RWA: Not owner")

        // Abnormal test case: need to stay required days
        await expect(rwAsset.investExit(indexInvesting))
                .to.be.revertedWith("RWA: Need to stay")
       
        // Test case: Normal case
        await ethers.provider.send("evm_increaseTime", [assetType.minInvestExit * 3600 * 24])
        const usdcBalanceBefore = await usdc.balanceOf(deployer.address)

        await expect(rwAsset.investExit(indexInvesting))
                .to.emit(usdc, 'Transfer')
                .withArgs(rwAsset.address, deployer.address, amountToken)
                .to.emit(rwAsset, 'InvestExit')
                .withArgs(deployer.address, indexInvesting, usdc.address, amountToken)

        expect(await usdc.balanceOf(deployer.address)).to.eq(usdcBalanceBefore.add(amountToken))

        let assetDetails =  {
          assetOwner:       user1.address,
          status:           3,  //Delivered,
          tokenId:          1,
          typeAsset:        1,
          numInvestings:    1,
          numQuotaTotal:    150 - 150,            // Aborted
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   1,
          onboardTimestamp: 0,
          sumAmountRepaid: 0,
          amountForInvestWithdarw: 0,
          amountInvestWithdarwed: 0
        }
        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetDetails));                

        let investing = {
          invester: deployer.address,
          assetId: 1,
          timestamp: lastBlock.timestamp,
          status: 2,                      // InvestAborted
          numQuota: 150
        }

        expect(await rwAsset.investList(indexInvesting)).to.deep.eq(Object.values(investing));   
                
        // Abnormal test case: Exit twice
        await expect(rwAsset.investExit(indexInvesting))
                .to.be.revertedWith("RWA: Wrong status")

        // Abnormal test case: Exit not allowed while onboarded
        await usdc.transfer(owner1.address, 1000 * 1000_000)
        await usdc.connect(owner1).approve(rwAsset.address, constants.MaxUint256)
        await rwAsset.connect(owner1).investAsset(1, 550)
        
        await rwAsset.connect(manager).onboardAsset(1)
        lastBlock = await ethers.provider.getBlock('latest')

        indexInvesting = (1<<16) + 2
        await expect(rwAsset.connect(owner1).investExit(indexInvesting))
                .to.be.revertedWith("RWA: Status not allowed")

      })

      it("RWAsset Test: rpow", async function () {

        let rate = BigNumber.from("1000000593415115246806684338")
        let seconds = 3600 *24
        let base27 = BigNumber.from("10").pow(27)

        let result = await rwAsset.rpow(rate, seconds, base27 )

        console.log("QQQQQQQQQQ", rate.toString(), result.toString())

        
        rate = BigNumber.from("79228209529453526788445080146")
        let base96 = BigNumber.from("2").pow(96)
        result = await rwAsset.rpow(rate, seconds, base96)

        console.log("PPPPPPPPPPPPPPPPPPP", rate.toString(), result.toString(), result.mul(base27).div(base96).toString())

        // Yeaely 20% : 1000000006341958396752917301    //
        rate = BigNumber.from("20").mul(base27).div(100).div(3600 *24 *365).add(base27)
        result = await rwAsset.rpow(rate, 3600 * 24 * 365, base27)

        console.log("PPPPPPPPPPPPPPPPPPP", rate.toString(), result.toString())

      })


  })
})