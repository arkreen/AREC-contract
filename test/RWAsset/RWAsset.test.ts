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
  amountGainPerInvest:  number
  amountDeposit:        number
  numSoldAssets:        number
  investTokenList:      number
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
          amountGainPerInvest:  75_000_000,
          amountDeposit:        1_500_000,
          numSoldAssets:        0,
          investTokenList:      1 + (2<<8)
        }
    
      });

      it("RWAsset Test: addNewInvestToken", async function () {
        await expect(rwAsset.addNewInvestToken([usdc.address, usdt.address, usdp.address, dai.address]))
                .to.be.revertedWith("RWA: Not manager")

        await expect(rwAsset.connect(manager).addNewInvestToken([usdc.address, usdt.address, usdp.address, dai.address]))
                .to.emit(rwAsset, 'AddNewInvestToken')
                .withArgs([usdc.address, usdt.address, usdp.address, dai.address])

        expect(await rwAsset.globalStatus()).to.deep.eq([0, 0, 0, 0, 0, 4]);
        expect(await rwAsset.allInvestTokens(1)).to.deep.eq(usdc.address);
        expect(await rwAsset.allInvestTokens(2)).to.deep.eq(usdt.address);
        expect(await rwAsset.allInvestTokens(3)).to.deep.eq(usdp.address);
        expect(await rwAsset.allInvestTokens(4)).to.deep.eq(dai.address);
      })

      it("RWAsset Test: addNewAssetType", async function () {

        await rwAsset.connect(manager).addNewInvestToken([usdc.address, usdt.address, usdp.address, dai.address])
        await expect(rwAsset.connect(manager).addNewAssetType(assetType))
                .to.emit(rwAsset, 'AddNewAssetType')
                .withArgs(Object.values(assetType))

        expect(await rwAsset.assetTypes(1)).to.deep.eq(Object.values(assetType));
        expect(await rwAsset.globalStatus()).to.deep.eq([1, 0, 0, 0, 0, 4]);

        await expect(rwAsset.addNewAssetType(assetType))
                .to.be.revertedWith("RWA: Not manager")

        assetType.typeAsset = 3
        await expect(rwAsset.connect(manager).addNewAssetType(assetType))
                .to.be.revertedWith("RWA: Wrong asset type")
      })

      it("RWAsset Test: depositForAsset", async function () {

        await rwAsset.connect(manager).addNewInvestToken([usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)

        const amountDeposit = expandTo18Decimals(assetType.amountDeposit)
        const balanceBefore = await AKREToken.balanceOf(user1.address)
 
        await expect(rwAsset.connect(user1).depositForAsset(1))
          .to.emit(rwAsset, 'DepositForAsset')
          .withArgs(user1.address, 1, amountDeposit)

        expect(await AKREToken.balanceOf(user1.address)).to.eq(balanceBefore.sub(amountDeposit))

        let assetOrder =  {
          assetOwner:       user1.address,
          status:           1,
          typeAsset:        1,
          numInvesters:     0,
          amountQuota:      0,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   0,
          onboardTimestamp: 0
        }
        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetOrder));
        expect(await rwAsset.globalStatus()).to.deep.eq([1, 1, 0, 0, 0, 4]);
        expect(await rwAsset.userOrderList(user1.address, 0)).to.deep.eq(1);

        await expect(rwAsset.connect(user1).depositForAsset(3))
            .to.be.revertedWith("RWA: Asset type not defined")
      })

      it("RWAsset Test: withdrawDeposit", async function () {

        await rwAsset.connect(manager).addNewInvestToken([usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)
        await rwAsset.connect(user1).depositForAsset(1)

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

        let assetOrder =  {
          assetOwner:       user1.address,
          status:           2,
          typeAsset:        1,
          numInvesters:     0,
          amountQuota:      0,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   0,
          onboardTimestamp: 0
        }
        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetOrder));
        expect(await AKREToken.balanceOf(user1.address)).to.eq(balanceBefore.add(amountDeposit))

        await expect(rwAsset.connect(user1).withdrawDeposit(1, constants.MaxUint256, signature))
                  .to.be.revertedWith("RWA: Not allowed")

      })

      it("RWAsset Test: deliverAsset", async function () {

        await rwAsset.connect(manager).addNewInvestToken([usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)
        await rwAsset.connect(user1).depositForAsset(1)

        const deliveryProof = "0x7120dcbcda0d9da55bc291bf4aaee8f691a0dcfbd4ad634017bb6f5686d92d74"     // Just for test

        await expect(rwAsset.connect(user1).deliverAsset(1, deliveryProof))
                .to.be.revertedWith("RWA: Not manager")

        await expect(rwAsset.connect(manager).deliverAsset(1, deliveryProof))
                .to.emit(rwAsset, 'DeliverAsset')
                .withArgs(1, deliveryProof)

        let assetOrder =  {
          assetOwner:       user1.address,
          status:           3,
          typeAsset:        1,
          numInvesters:     0,
          amountQuota:      0,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   1,
          onboardTimestamp: 0
        }

        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetOrder));
        expect(await rwAsset.deliveryProofList(1)).to.deep.eq(deliveryProof);
        expect(await rwAsset.globalStatus()).to.deep.eq([1, 1, 0, 1, 0, 4]);
       
        await expect(rwAsset.connect(manager).deliverAsset(1, deliveryProof))
                .to.be.revertedWith("RWA: Not allowed")

      })

      it("RWAsset Test: onboardAsset", async function () {

        await rwAsset.connect(manager).addNewInvestToken([usdc.address, usdt.address, usdp.address, dai.address])
        await rwAsset.connect(manager).addNewAssetType(assetType)
        await rwAsset.connect(user1).depositForAsset(1)

        const deliveryProof = "0x7120dcbcda0d9da55bc291bf4aaee8f691a0dcfbd4ad634017bb6f5686d92d74"     // Just for test
        await rwAsset.connect(manager).deliverAsset(1, deliveryProof)

        await expect(rwAsset.connect(user1).onboardAsset(1))
                .to.be.revertedWith("RWA: Not manager")

        await expect(rwAsset.connect(manager).onboardAsset(1))
                .to.emit(rwAsset, 'OnboardAsset')
                .withArgs(1)

        const lastBlock = await ethers.provider.getBlock('latest')

        let assetOrder =  {
          assetOwner:       user1.address,
          status:           4,
          typeAsset:        1,
          numInvesters:     0,
          amountQuota:      0,
          amountDeposit:    assetType.amountDeposit,
          deliverProofId:   1,
          onboardTimestamp: lastBlock.timestamp
        }

        expect(await rwAsset.assetList(1)).to.deep.eq(Object.values(assetOrder));
        expect(await rwAsset.deliveryProofList(1)).to.deep.eq(deliveryProof);
        expect(await rwAsset.globalStatus()).to.deep.eq([1, 1, 0, 1, 1, 4]);
       
        await expect(rwAsset.connect(manager).onboardAsset(1))
                .to.be.revertedWith("RWA: Not allowed")

      })


  })
})