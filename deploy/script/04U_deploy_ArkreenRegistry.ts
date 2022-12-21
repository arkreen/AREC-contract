import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECIssuance__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerAddress } = await getNamedAccounts();

    console.log("Deploying Updated ArkreenRegistry: ", CONTRACTS.gRegistry, deployerAddress);  
    
    const ArkreenRegistry_Upgrade = await deploy(CONTRACTS.gRegistry, {
        from: deployerAddress,
        args: [123],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    if(hre.network.name === 'matic_test') {
        const REGISTRY_ADDRESS = "0xa299b0e5e55988b07dea7eccfb23bfdd14b1b2b0"       // Need to check
        const NEW_IMPLEMENTATION = ArkreenRegistry_Upgrade.address

        const [deployer] = await ethers.getSigners();
        const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REGISTRY_ADDRESS, deployer);

        const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate")
//      const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
        const updateTx = await ArkreenRECIssuanceFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        await updateTx.wait()

        console.log("callData, update", callData, updateTx)
        console.log("ArkreenRegistry deployed to %s: ", hre.network.name, ArkreenRECIssuanceFactory.address);
    } 
};

func.tags = ["gRegistryU"];

export default func;
