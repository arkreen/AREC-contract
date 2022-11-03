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
     
    if(hre.network.name === 'matic_test') {
        const PROXY_ADDRESS      = "0x776ec260b164dc81247f584d9d2c85ed0c76dba8"       // Need to check
        const NEW_IMPLEMENTATION = "0x6e0bdabacb4a373bea711f4720702b30be585057"       // Need to check

        const [deployer] = await ethers.getSigners();
        const ArkreenTokenUpgradeableV2 = ArkreenTokenUpgradeableV2__factory.connect(PROXY_ADDRESS, deployer);

        const callData = ArkreenTokenUpgradeableV2.interface.encodeFunctionData("postUpdate")
//      const callData = ArkreenTokenUpgradeableV2.interface.encodeFunctionData("postUpdate", [...])
        const updateTx = await ArkreenTokenUpgradeableV2.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        await updateTx.wait()

        console.log("callData, update", callData, updateTx)
        console.log("ArkreenRetirement deployed to %s: ", hre.network.name, ArkreenTokenUpgradeableV2.address);
    } 
};

func.tags = ["gAKRE2U"];

export default func;
