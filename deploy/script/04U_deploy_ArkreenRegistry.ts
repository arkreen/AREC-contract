import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRegistry__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerAddress } = await getNamedAccounts();

    console.log("Deploying Updated ArkreenRegistry: ", CONTRACTS.gRegistry, deployerAddress);  

    if(hre.network.name === 'matic_test') {
        const REGISTRY_ADDRESS    =   "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"       // Need to check  // Simulation
        const NEW_IMPLEMENTATION  =   "0x29840F70cb8DDbFBA9890c40C1babc6A2C904E6C"       // 2023/02/26
    
        const [deployer] = await ethers.getSigners();
        const ArkreenRegistryFactory = ArkreenRegistry__factory.connect(REGISTRY_ADDRESS, deployer);

//      const callData = ArkreenRegistryFactory.interface.encodeFunctionData("postUpdate")
//      const updateTx = ArkreenRegistryFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
//      const updateTx = await ArkreenRegistryFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        const updateTx = await ArkreenRegistryFactory.upgradeTo(NEW_IMPLEMENTATION)
        await updateTx.wait()

        console.log("callData, update", updateTx)
        console.log("ArkreenRegistry deployed to %s: ", hre.network.name, ArkreenRegistryFactory.address);
    }
};

func.tags = ["gRegistryU"];

export default func;
