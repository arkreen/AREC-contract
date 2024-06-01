import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
const {ethers, upgrades} =  require("hardhat");
import hre from 'hardhat'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { getPermitDigest, getDomainSeparator, expandTo18Decimals, randomAddresses } from '../utils/utilities'
import { constants, BigNumber, } from 'ethers'

import {
    ArkreenToken,
    GreenBTC2,
    GreenBTC2__factory,
    ArkreenToken__factory,
    ArkreenTokenTest__factory
    // ArkreenTokenV2,
    // ArkreenTokenV2__factory
} from "../../typechain";

describe("GreenBTC2 Test Campaign", ()=>{

    async function deployFixture() {
        const [deployer, manager, user1, user2] = await ethers.getSigners();

        const ArkreenTokenFactory = await ethers.getContractFactory("ArkreenToken")
        const arkreenToken: ArkreenToken = await upgrades.deployProxy(
                                ArkreenTokenFactory, [10000000000, deployer.address, '', ''])
  
        await arkreenToken.deployed()

        const GreenBTC2Factory = await ethers.getContractFactory("GreenBTC2")

        const GreenBTC2: GreenBTC2 = await upgrades.deployProxy(
                                          GreenBTC2Factory, [])
        await GreenBTC2.deployed()

        return {arkreenToken, GreenBTC2, deployer, manager, user1, user2}
    }

    describe('GreenBTC2 test', () => {

      const domainInfo = {
                x: 5,  y: 6, w:  7, h: 8,
                boxTop: 3000,
                chance1: 15,   chance2: 200, chance3: 1000, chance4: 0,
                ratio1: 500,   ratio2: 1500, ratio3: 0,     ratio4: 0,
                allchance: 0
              }

      const ratiosSum = 15 + 200 + 1000 + 500 + 1500

      const domainInfoBigInt= BigNumber.from(domainInfo.x).shl(248)
                         .add(BigNumber.from(domainInfo.y).shl(240))
                         .add(BigNumber.from(domainInfo.w).shl(232))
                         .add(BigNumber.from(domainInfo.h).shl(224))
                         .add(BigNumber.from(domainInfo.boxTop).shl(192))
                         .add(BigNumber.from(domainInfo.chance1).shl(176))
                         .add(BigNumber.from(domainInfo.chance2).shl(160))
                         .add(BigNumber.from(domainInfo.chance3).shl(144))
                         .add(BigNumber.from(domainInfo.chance4).shl(128))
                         .add(BigNumber.from(domainInfo.ratio1).shl(112))
                         .add(BigNumber.from(domainInfo.ratio2).shl(96))
                         .add(BigNumber.from(domainInfo.ratio3).shl(80))
                         .add(BigNumber.from(domainInfo.ratio4).shl(64))

      it("GreenBTC2 basics test", async function () {
        const {arkreenToken, GreenBTC2, deployer, manager, user1, user2} = await loadFixture(deployFixture)

        await arkreenToken.transfer(GreenBTC2.address, expandTo18Decimals(100000000))

        const domainID = 1

        const registerDomainTx = await GreenBTC2.registerDomain(domainID, domainInfoBigInt.add(BigNumber.from(65535)).toHexString())

        expect(await  GreenBTC2.getDomain(1)).to.eq(domainInfoBigInt.add(ratiosSum))
        
        const domain = await  GreenBTC2.getDomain(1)

        console.log("WWWWWWWWWWWWWWWW", registerDomainTx, domain);


        const greenizetx = await  GreenBTC2.makeGreenBox(1,123)

        const receipt = await greenizetx.wait()

        console.log("VVVVVVVVVVVVVVVV", receipt);

//        await expect(GreenBTC2.registerDomain(domainID, domainInfoBigInt.toHexString())).to.be.revertedWith("CLAIM: Not Manager")
        
      });


    })
})