import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { constants, utils, BigNumber, Contract } from 'ethers'
import { ethers, network, upgrades } from "hardhat";

import {
    ArkreenTokenTest,
    ArkreenTokenTest__factory,
    ArkreenRegistery,
    ArkreenRECToken,
} from "../typechain";

describe("ArkreenRegistery", () => {
    let deployer:           SignerWithAddress
    let bob:                SignerWithAddress
    let alice:              SignerWithAddress
    let AKREToken:          ArkreenTokenTest
    let arkreenRegistery:   ArkreenRegistery
    let arkreenRECToken:    ArkreenRECToken

    beforeEach(async () => {
        [deployer, bob, alice] = await ethers.getSigners();

        AKREToken = await new ArkreenTokenTest__factory(deployer).deploy(10_000_000_000);
        await AKREToken.deployed();

        const ArkreenRegisteryFactory = await ethers.getContractFactory("ArkreenRegistery")
        arkreenRegistery = await upgrades.deployProxy(ArkreenRegisteryFactory,[]) as ArkreenRegistery
        await arkreenRegistery.deployed()

        const ArkreenRECTokenFactory = await ethers.getContractFactory("ArkreenRECToken")
        arkreenRECToken = await upgrades.deployProxy(ArkreenRECTokenFactory,[arkreenRegistery.address, bob.address]) as ArkreenRECToken
        await arkreenRECToken.deployed()        
    });

    it("ArkreenRegistery: pause & unpause", async () => {
      await arkreenRegistery.pause()
      expect( await arkreenRegistery.paused()).to.equals(true)

      await arkreenRegistery.unpause()
      expect( await arkreenRegistery.paused()).to.equals(false)    

//      let PAUSER = utils.keccak256(utils.toUtf8Bytes('PAUSER_ROLE')
//      await arkreenRegistery.grantRole(PAUSER, bob.address)
    })

    it("ArkreenRegistery: addRECIssuer", async () => {
        await expect(arkreenRegistery.connect(bob).addRECIssuer(bob.address, arkreenRECToken.address, "Arkreen Issuer"))
                .to.be.revertedWith("Ownable: caller is not the owner")      

        await expect(arkreenRegistery.addRECIssuer(constants.AddressZero, arkreenRECToken.address, "Arkreen Issuer"))
                .to.be.revertedWith("Arkreen: Zero Address")

        await arkreenRegistery.addRECIssuer(bob.address, arkreenRECToken.address, "Arkreen Issuer")
        expect(await arkreenRegistery.numIssuers()).to.equal(1);

        let lastBlock = await ethers.provider.getBlock('latest')
        let recIssuers = [true, lastBlock.timestamp, 0, arkreenRECToken.address, "Arkreen Issuer"]
        expect(await arkreenRegistery.recIssuers(bob.address)).to.deep.equal(recIssuers);

        await expect(arkreenRegistery.addRECIssuer(bob.address, arkreenRECToken.address, "Arkreen Issuer"))
                      .to.be.revertedWith("Arkreen: Issuer Already Added")    

        await arkreenRegistery.addRECIssuer(alice.address, arkreenRECToken.address, "Arkreen Issuer")
        expect(await arkreenRegistery.numIssuers()).to.equal(2);

        lastBlock = await ethers.provider.getBlock('latest')
        recIssuers = [true, lastBlock.timestamp, 0, arkreenRECToken.address, "Arkreen Issuer"]
        expect(await arkreenRegistery.recIssuers(alice.address)).to.deep.equal(recIssuers);
    });

    it("ArkreenRegistery: removeRECIssuer", async () => {
      await expect(arkreenRegistery.connect(bob).removeRECIssuer(bob.address))
              .to.be.revertedWith("Ownable: caller is not the owner")      

      await arkreenRegistery.addRECIssuer(bob.address, arkreenRECToken.address, "Arkreen Issuer")

      await expect(arkreenRegistery.removeRECIssuer(constants.AddressZero))
              .to.be.revertedWith("Arkreen: Zero Address")

      await expect(arkreenRegistery.removeRECIssuer(alice.address))
              .to.be.revertedWith("Arkreen: Issuer Not Added")  

      await arkreenRegistery.addRECIssuer(alice.address, arkreenRECToken.address, "Arkreen Issuer")        
      expect(await arkreenRegistery.numIssuers()).to.equal(2);  

      let { addTime: bobAddTime } = await arkreenRegistery.recIssuers(bob.address)
      await arkreenRegistery.removeRECIssuer(bob.address)
      expect(await arkreenRegistery.numIssuers()).to.equal(2);  

      let lastBlock = await ethers.provider.getBlock('latest')
      let recIssuers = [false, bobAddTime, lastBlock.timestamp, arkreenRECToken.address, "Arkreen Issuer"]
      expect(await arkreenRegistery.recIssuers(bob.address)).to.deep.equal(recIssuers);      
  
      let { addTime: aliceAddTime } = await arkreenRegistery.recIssuers(alice.address)
      await arkreenRegistery.removeRECIssuer(alice.address)
      lastBlock = await ethers.provider.getBlock('latest')
      recIssuers = [false, aliceAddTime, lastBlock.timestamp, arkreenRECToken.address, "Arkreen Issuer"]

      expect(await arkreenRegistery.numIssuers()).to.equal(2);  
      expect(await arkreenRegistery.recIssuers(alice.address)).to.deep.equal(recIssuers);              
  });

});
