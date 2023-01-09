import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRegistry__factory } from "../../typechain";

// Pause/Unpause
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerAddress } = await getNamedAccounts();

    console.log("Pause/Unpause ArkreenRegistry: ", CONTRACTS.gRegistry, deployerAddress);  
    
    if(hre.network.name === 'matic_test') {
        const REGISTRY_ADDRESS = "0x047Eb5205251c5fC8A21BA8F8D46f57Df62013c8"    // Simulation in testnet, Need to check

        const [deployer] = await ethers.getSigners();
        const ArkreenRegistryFactory = ArkreenRegistry__factory.connect(REGISTRY_ADDRESS, deployer);

//      const callData = ArkreenRegistryFactory.interface.encodeFunctionData("pause")
//      const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
        const updateTx = await ArkreenRegistryFactory.pause()
//      const updateTx = await ArkreenRegistryFactory.unpause()

        await updateTx.wait()

        console.log("callData, update", updateTx)
        console.log("ArkreenRegistry deployed to %s: ", hre.network.name, ArkreenRegistryFactory.address);
    } 
};

func.tags = ["gRegistryP"];

export default func;
