import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECIssuance__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerAddress } = await getNamedAccounts();

    console.log("Updating ArkreenRECIssuance: ", CONTRACTS.RECIssuance, deployerAddress);  
    
//    const ArkreenRegistery_Upgrade = await deploy(CONTRACTS.RECIssuance, {
//        from: deployerAddress,
//        args: [123],
//        log: true,
//        skipIfAlreadyDeployed: false,
//    });

    if(hre.network.name === 'matic_test') {
        const REGISTRY_ADDRESS = "0x95f56340889642a41b913c32d160d2863536e073"       // Need to check
        const NEW_IMPLEMENTATION = "0x020287A42cF2cbc5E8583968456EFB1db90cAe9c"     // Need to check

        const [deployer] = await ethers.getSigners();
        const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REGISTRY_ADDRESS, deployer);

        const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate")
//      const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate", [])
        const updateTx = await ArkreenRECIssuanceFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        await updateTx.wait()

        console.log("callData, update", callData, updateTx)
        console.log("ArkreenRECIssuance Updated to %s: ", hre.network.name, ArkreenRECIssuanceFactory.address);
    } 
};

func.tags = ["RECIssueU"];

export default func;
