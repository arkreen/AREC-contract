import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
    ArkreenTokenTest,
    ArkreenTokenTest__factory,
} from "../typechain";

describe("ArkreenToken", () => {
    let deployer: SignerWithAddress;
    let bob: SignerWithAddress;
    let alice: SignerWithAddress;
    let AKREToken: ArkreenTokenTest;

    beforeEach(async () => {
        [deployer, bob, alice] = await ethers.getSigners();

        AKREToken = await new ArkreenTokenTest__factory(deployer).deploy(10_000_000_000);
        await AKREToken.deployed();
    });

    it("correctly constructs an ERC20", async () => {
        expect(await AKREToken.name()).to.equal("Arkreen DAO Token");
        expect(await AKREToken.symbol()).to.equal("AKRE");
        expect(await AKREToken.decimals()).to.equal(18);
    });

    describe("mint", () => {
        it("must be done by vault", async () => {
            await expect(AKREToken.connect(bob).mint(bob.address, 100)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("increases total supply", async () => {
            const supplyBefore = await AKREToken.totalSupply();
            await AKREToken.connect(deployer).mint(bob.address, 100);
            expect(supplyBefore.add(100)).to.equal(await AKREToken.totalSupply());
        });
    });

    describe("burn", () => {
        beforeEach(async () => {
            await AKREToken.connect(deployer).mint(bob.address, 100);
        });

        it("reduces the total supply", async () => {
            const supplyBefore = await AKREToken.totalSupply();
            await AKREToken.connect(bob).burn(10);
            expect(supplyBefore.sub(10)).to.equal(await AKREToken.totalSupply());
        });

        it("cannot exceed total supply", async () => {
            const supply = await AKREToken.totalSupply();
            await expect(AKREToken.connect(bob).burn(supply.add(1))).to.be.revertedWith(
                "ERC20: burn amount exceeds balance"
            );
        });

        it("cannot exceed bob's balance", async () => {
            await AKREToken.connect(deployer).mint(alice.address, 15);
            await expect(AKREToken.connect(alice).burn(16)).to.be.revertedWith(
                "ERC20: burn amount exceeds balance"
            );
        });
    });
});
