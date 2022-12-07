import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenBadge__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerAddress } = await getNamedAccounts();

    console.log("Deploying Updated ArkreenRetirement: ", CONTRACTS.RECRetire, deployerAddress);  
   
/* 
    const ArkreenRetirement_Upgrade = await deploy(CONTRACTS.RECRetire, {
        from: CONTRACTS.RECRetire,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
    });
*/
  
    if(hre.network.name === 'matic_test') {
        const PROXY_ADDRESS = "0x5C653b445BE2bdEB6f8f3CD099FC801865Cab835"       // Need to check
//      const NEW_IMPLEMENTATION = ArkreenRetirement_Upgrade.address
        const NEW_IMPLEMENTATION = '0x6f4fff7faa238cd68f03de75b8906e23dbd95f30'   // Need to check

        const [deployer] = await ethers.getSigners();
        const ArkreenRetirementFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS, deployer);

        const callData = ArkreenRetirementFactory.interface.encodeFunctionData("postUpdate")
//      const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
        const updateTx = await ArkreenRetirementFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        await updateTx.wait()

        console.log("callData, update", callData, updateTx)
        console.log("ArkreenRetirement deployed to %s: ", hre.network.name, ArkreenRetirementFactory.address);
    } 
};

func.tags = ["RECRetireU"];

export default func;
