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
    
    const ArkreenRECIssuanceFactory = await ethers.getContractFactory("ArkreenRECIssuance");
    const ArkreenRECIssuance_Upgrade = await ArkreenRECIssuanceFactory.deploy();
    await ArkreenRECIssuance_Upgrade.deployed();

    if(hre.network.name === 'matic_test') {
        const REGISTRY_ADDRESS = "0x95f56340889642a41b913c32d160d2863536e073"       // Need to check
//      const REGISTRY_ADDRESS = "0xb917c92458a23c6934ca34c6d4468ec8565c1313"       // Need to check
        
//      const NEW_IMPLEMENTATION = "0x020287A42cF2cbc5E8583968456EFB1db90cAe9c"     // Need to check
//      const NEW_IMPLEMENTATION = "0x6b90164f3d7384FcA613804b85ead792cc3Efd8e"     // Need to check
        const NEW_IMPLEMENTATION = ArkreenRECIssuance_Upgrade.address

        const [deployer] = await ethers.getSigners();
        const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REGISTRY_ADDRESS, deployer);

//      const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate")
//      const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate", [])
//      const updateTx = await ArkreenRECIssuanceFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        const updateTx = await ArkreenRECIssuanceFactory.upgradeTo(NEW_IMPLEMENTATION)
        await updateTx.wait()

        console.log("callData, update", updateTx)
        console.log("ArkreenRECIssuance Updated to %s: ", hre.network.name, ArkreenRECIssuanceFactory.address);
    } 
};

func.tags = ["RECIssueU"];

export default func;
