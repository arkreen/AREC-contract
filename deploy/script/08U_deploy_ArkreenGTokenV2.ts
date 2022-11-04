import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenTokenUpgradeableV2__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerAddress } = await getNamedAccounts();

    console.log("Deploying Updated ArkreenRetirement: ", CONTRACTS.RECRetire, deployerAddress);  
     
    if(hre.network.name === 'matic') {
        const PROXY_ADDRESS       = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"       // Need to check
        const NEW_IMPLEMENTATION  = "0xc039075e8abb0821bb0e7ddf43718345900c19c8"       // Need to check
        const FOUNDATION_ADDRESS  = "0x1C9055Db231CD96447c61D07B3cEA77592154C3d"  //from Gery        

        const [deployer] = await ethers.getSigners();
        const ArkreenTokenUpgradeableV2 = ArkreenTokenUpgradeableV2__factory.connect(PROXY_ADDRESS, deployer);

        const callData = ArkreenTokenUpgradeableV2.interface.encodeFunctionData("postUpdate", [FOUNDATION_ADDRESS])
//      const callData = ArkreenTokenUpgradeableV2.interface.encodeFunctionData("postUpdate", [...])
        const updateTx = await ArkreenTokenUpgradeableV2.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        await updateTx.wait()

        console.log("callData, update", callData, updateTx)
        console.log("ArkreenRetirement deployed to %s: ", hre.network.name, ArkreenTokenUpgradeableV2.address);
    } 
};

func.tags = ["gAKRE2U"];

export default func;
