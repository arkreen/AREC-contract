import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
const {ethers, upgrades} =  require("hardhat");
import hre from 'hardhat'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { getPermitDigest, expandTo18Decimals } from '../utils/utilities'
import { constants } from 'ethers'

// console.log(upgrades)

import {
    ArkreenToken,
    ArkreenToken__factory,
    // ArkreenTokenV2,
    // ArkreenTokenV2__factory
} from "../../typechain";

describe("test ArkreenToken", ()=>{

    async function deployFixture() {
        const [deployer, user1, user2] = await ethers.getSigners();
        const ArkreenTokenFactory = await ethers.getContractFactory("ArkreenToken")
        const ArkreenToken : ArkreenToken = await upgrades.deployProxy(
            ArkreenTokenFactory, [10000000000, user1.address, '' , ''])
  
        await ArkreenToken.deployed()

        return {ArkreenToken, deployer, user1, user2}
    }

    describe('init test', () => {
        it("all argument should be set correctly ", async function () {

            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
            expect(await ArkreenToken.totalSupply()).to.equal(expandTo18Decimals(10000000000));
            expect(await ArkreenToken.balanceOf(user1.address)).to.equal(expandTo18Decimals(10000000000));
            expect(await ArkreenToken.balanceOf(user2.address)).to.equal(0);
            expect(await ArkreenToken.owner()).to.be.equal(deployer.address)
        });

        it('function initialize() could be execute only onec',async () => {
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
            await expect(ArkreenToken.initialize(10000000000, user1.address, '', '')).to.be.revertedWith("Initializable: contract is already initialized")
        })
    })

    describe('permit test', () => {

        it("approve by permit transaction", async () => {

            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
            const user1_key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
            const value = 100
            const nonce = 0
            const deadline = 19000000000
            const domainName = await ArkreenToken.name()

            const digest = getPermitDigest(
                    user1.address,
                    user2.address,
                    ethers.BigNumber.from(value),
                    ethers.BigNumber.from(nonce),
                    ethers.BigNumber.from(deadline),
                    ArkreenToken.address,
                    domainName
                  )

            const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(user1_key.slice(2), 'hex'))

            expect(await ArkreenToken.connect(deployer).permit(
                user1.address, 
                user2.address, 
                ethers.BigNumber.from(value), 
                ethers.BigNumber.from(deadline),
                v,  r,  s)).to.be.ok

            expect(await ArkreenToken.allowance(user1.address, user2.address)).to.be.equal(value)
        })

        it("expired deadline should be reverted", async ()=>{
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
            // console.log(await ethers.getSigners())
            const user1_key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
            const value = 100
            const nonce = 0
            const deadline = 19000000
            const domainName = await ArkreenToken.name()
            // console.log("domain name is :",domainName)

            const digest = getPermitDigest(
                    user1.address,
                    user2.address,
                    ethers.BigNumber.from(value),
                    ethers.BigNumber.from(nonce),
                    ethers.BigNumber.from(deadline),
                    ArkreenToken.address,
                    domainName                    
                  )
            // const sig = await (user1 as SignerWithAddress).signMessage(digest)

            // console.log(sig)

            const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(user1_key.slice(2), 'hex'))
            // console.log(v, r, s)

            await expect(ArkreenToken.connect(deployer).permit(
                user1.address, 
                user2.address, 
                ethers.BigNumber.from(value), 
                ethers.BigNumber.from(deadline),
                v,  r,  s)).to.be.revertedWith("ERC20Permit: expired deadline")

        })

        it("wrong version cause sig error ,should be reverted", async ()=>{
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
            const user1_key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
            const value = 100
            const nonce = 0
            const deadline = 19000000000
            const domainName = await ArkreenToken.name()

            const digest = getPermitDigest(
                    user1.address,
                    user2.address,
                    ethers.BigNumber.from(value),
                    ethers.BigNumber.from(nonce),
                    ethers.BigNumber.from(deadline),
                    ArkreenToken.address,
                    domainName + 'X',
                  )

            const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(user1_key.slice(2), 'hex'))

            await expect(ArkreenToken.connect(deployer).permit(
                user1.address, 
                user2.address, 
                ethers.BigNumber.from(value), 
                ethers.BigNumber.from(deadline),
                v,  r,  s)).to.be.revertedWith("ERC20Permit: invalid signature")

        })

    })

    describe("pause test", ()=>{

        it('if paused , transfer is forbidden', async () => {
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)

            await ArkreenToken.connect(deployer).pause();
            await expect(ArkreenToken.connect(user1).transfer(user2.address, expandTo18Decimals(100))).to.be.revertedWith('Pausable: paused')
        })

        it('if unpaused , transfer is allowed', async () => {
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
           
            await ArkreenToken.connect(deployer).pause();
            await ArkreenToken.connect(deployer).unpause();
            expect(await ArkreenToken.connect(user1).transfer(user2.address, expandTo18Decimals(100))).to.be.ok
            expect(await ArkreenToken.balanceOf(user2.address)).to.equal(expandTo18Decimals(100));
        })
    })

    describe("ownerable test", ()=>{

        it('only owner could call pause/unpause function',async () => {
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
            expect(await ArkreenToken.connect(deployer).pause()).to.be.ok;
            await expect(ArkreenToken.connect(user1).unpause()).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('only owner can transfer ownership',async () => {
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)

            expect(await ArkreenToken.owner()).to.be.equal(deployer.address)
            await ArkreenToken.transferOwnership(user1.address)
            await expect(ArkreenToken.transferOwnership(user2.address)).to.be.revertedWith("Ownable: caller is not the owner")
            await ArkreenToken.connect(user1).transferOwnership(user2.address)
            expect(await ArkreenToken.owner()).to.be.equal(user2.address)
        })

        it('transfer ownership to address 0 is not allowed',async () => {
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
            await expect(ArkreenToken.transferOwnership(constants.AddressZero)).to.be.revertedWith("Ownable: new owner is the zero address")
        })

    })

    /*
    describe("upgrade test", ()=>{

        it("contract owner should be deployer", async () =>{
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)

            expect(await ArkreenToken.connect(deployer).owner()).to.be.equal(deployer.address)
        })

        it("upgrade method 1", async ()=> {

            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)

            let ArkreenTokenV2Factory = await ethers.getContractFactory("ArkreenTokenV2")
            let AKRETokenV2 = await ArkreenTokenV2Factory.deploy()
            await AKRETokenV2.deployed()

            const ArkreenTokenFactory = ArkreenToken__factory.connect(ArkreenToken.address, deployer);
            let calldata = ArkreenToken.interface.encodeFunctionData("postUpdate", [user2.address])
            const updateTx = await ArkreenToken.upgradeToAndCall(AKRETokenV2.address, calldata)
            await updateTx.wait()

            // console.log(await upgrades.erc1967.getImplementationAddress(ArkreenToken.address)," getImplementationAddress")
            // console.log(await upgrades.erc1967.getAdminAddress(ArkreenToken.address)," getAdminAddress") 

            expect(await upgrades.erc1967.getImplementationAddress(ArkreenToken.address)).to.be.equal(AKRETokenV2.address)
            expect(await ArkreenToken.balanceOf(user2.address)).to.be.equal(expandTo18Decimals((10_000_000_000 - 10))
        })

        it("upgrade method 2", async ()=>{

            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)
            
            let ArkreenTokenV2Factory = await ethers.getContractFactory("ArkreenTokenV2")
            let arkreenTokenV2 = await upgrades.upgradeProxy(ArkreenToken.address, ArkreenTokenV2Factory)

            expect(arkreenTokenV2.address).to.be.equal(ArkreenToken.address)

            //expect(await ArkreenTokenUpgradeable2.connect(deployer).nonces(receiver.address)).to.be.equal(0)
            expect(await arkreenTokenV2.connect(deployer).setMarking('aaaaa')).to.be.ok
            expect(await arkreenTokenV2.connect(deployer).marking()).to.be.equal('aaaaa')

        })

        it('only owner could do upgrade',async () => {
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)

            let ArkreenTokenV2Factory = await ethers.getContractFactory("ArkreenTokenV2")
            let AKRETokenV2 = await ArkreenTokenV2Factory.deploy()
            await AKRETokenV2.deployed()
            
            await expect(ArkreenToken.connect(user1).upgradeTo(AKRETokenV2.address)).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('proxy test',async () => {
        
        it('only proxy could call postUpdate',async () => {
            
            const {ArkreenToken, deployer, user1, user2} = await loadFixture(deployFixture)

            let ArkreenTokenFactory = await ethers.getContractFactory("ArkreenToken")
            let AKRETokenV1 = await ArkreenTokenFactory.deploy()
            await AKRETokenV1.deployed()

            await expect(AKRETokenV1.postUpdate(user1.address)).to.be.revertedWith('Function must be called through delegatecall')
        })
    })
    */
})