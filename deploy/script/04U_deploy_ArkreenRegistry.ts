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
//      const REGISTRY_ADDRESS    =   "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"       // Need to check  // Simulation
//      const NEW_IMPLEMENTATION  =   "0x29840F70cb8DDbFBA9890c40C1babc6A2C904E6C"       // 2023/02/26

        const REGISTRY_ADDRESS    =   "0x61A914363Ef99AabCa69504cee5ccfd5523C845d"       // MATIC test net
        const NEW_IMPLEMENTATION  =   "0x29840F70cb8DDbFBA9890c40C1babc6A2C904E6C"       // 2023/03/28: Reuse simu implt
      
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

    else if(hre.network.name === 'celo_test') {
        const REGISTRY_ADDRESS    =   "0x572e9B8B210414b2D76ddf578925D769D96982E6"       // Celo test net
//      const NEW_IMPLEMENTATION  =   "0x19444425121096d92c0eEC7eFf84ba0094C8f634"       // 2024/01/11: Update REC token issuer
        const NEW_IMPLEMENTATION  =   "0xB2Dda4591b015BC96632FEB0d24B65AB7485959f"       // 2024/01/11A: Update REC token issuer: fix

        const [deployer] = await ethers.getSigners();
        const ArkreenRegistryFactory = ArkreenRegistry__factory.connect(REGISTRY_ADDRESS, deployer);
      
        const updateTx = await ArkreenRegistryFactory.upgradeTo(NEW_IMPLEMENTATION)
        await updateTx.wait()
      
        console.log("callData, update", updateTx)
        console.log("ArkreenRegistry is updated: %s", hre.network.name, ArkreenRegistryFactory.address);
    }
    
    else if(hre.network.name === 'matic') {
        const REGISTRY_ADDRESS    =   "0xb17faCaCA106fB3D216923DB6CaBFC7C0517029d"       // MATIC mainnet normal release
        const NEW_IMPLEMENTATION  =   "0x8668dD561a693aB7F8B48b599B692F2EFB070937"       // 2023/04/04: Upgrade to update tAKRE
      
        const [deployer] = await ethers.getSigners();
        const ArkreenRegistryFactory = ArkreenRegistry__factory.connect(REGISTRY_ADDRESS, deployer);

//      const callData = ArkreenRegistryFactory.interface.encodeFunctionData("postUpdate")
//      const updateTx = ArkreenRegistryFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
//      const updateTx = await ArkreenRegistryFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        const updateTx = await ArkreenRegistryFactory.upgradeTo(NEW_IMPLEMENTATION)
        await updateTx.wait()

        console.log("callData, update", updateTx)
        console.log("ArkreenRegistry updated to %s: ", hre.network.name, ArkreenRegistryFactory.address);
    }
};

// 2023/04/04: yarn deploy:matic:gRegistryU
// Upgrade to update tAKRE

// 2024/01/11: yarn deploy:celo_test:gRegistryU
// Upgrade to update tAKRE

// 2024/01/11A: yarn deploy:celo_test:gRegistryU
// Upgrade to update tAKRE

func.tags = ["gRegistryU"];

export default func;
