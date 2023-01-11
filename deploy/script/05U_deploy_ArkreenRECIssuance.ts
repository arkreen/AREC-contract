import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECIssuance__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();
    console.log("Updating ArkreenRECIssuance: ", CONTRACTS.RECIssuance, deployer.address);  

//    Cannot be verified in this way    
//    const ArkreenRECIssuanceFactory = await ethers.getContractFactory("ArkreenRECIssuance");
//    const ArkreenRECIssuance_Upgrade = await ArkreenRECIssuanceFactory.deploy();
//    await ArkreenRECIssuance_Upgrade.deployed();

    if(hre.network.name === 'matic_test') {
//      const REGISTRY_ADDRESS = "0x95f56340889642a41b913c32d160d2863536e073"       // Need to check  // Simu mode
//      const REGISTRY_ADDRESS = "0xb917c92458a23c6934ca34c6d4468ec8565c1313"       // Need to check
        const REGISTRY_ADDRESS = "0x7370c2166d7720c41f0931f0bbf67e10d00b0d18"       // Need to check  // MATIC Testnet
        
//      const NEW_IMPLEMENTATION = "0x020287A42cF2cbc5E8583968456EFB1db90cAe9c"     // Need to check
//      const NEW_IMPLEMENTATION = "0x6b90164f3d7384FcA613804b85ead792cc3Efd8e"     // Need to check
//      const NEW_IMPLEMENTATION = ArkreenRECIssuance_Upgrade.address
//      const NEW_IMPLEMENTATION = "0x8EC22833682177A88c3503a1aEccFFA2e35CdC07"
//      const NEW_IMPLEMENTATION = "0x09fD58cf56a3f307910CA72eA47a85D7e48EB828"     // 3. Upgrade to support solidify and offset trace

//      const NEW_IMPLEMENTATION = "0x1FF4CEeB240791B6d7247Dd1Ae2308F2bb77ABca"     // 4. Remove the checking if being miner, for simu mode
        const NEW_IMPLEMENTATION = "0x09fD58cf56a3f307910CA72eA47a85D7e48EB828"     // 4. Reuse For Matic testnet

        const [deployer] = await ethers.getSigners();
        const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REGISTRY_ADDRESS, deployer);

//      const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate")
//      const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate", [])
//      const updateTx = await ArkreenRECIssuanceFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
        const updateTx = await ArkreenRECIssuanceFactory.upgradeTo(NEW_IMPLEMENTATION)
        await updateTx.wait()

        console.log("callData, update", updateTx)
        console.log("ArkreenRECIssuance Updated to %s: ", hre.network.name, 
                                  ArkreenRECIssuanceFactory.address, NEW_IMPLEMENTATION);
    } 

    if(hre.network.name === 'matic') {
      const REGISTRY_ADDRESS = "0x45D0c0E2480212A60F1a9f2A820F1d7d6472CA6B"       // Need to check
     
      // const NEW_IMPLEMENTATION = "0x0730A83F7a141BBea876C0fCfd2e9BED3e4C195F"  // 1. Original 
      const NEW_IMPLEMENTATION = "0xEf06990Ee1c2F2694acd87b189d0EbA84DdB7124"     // 2. Upgrade to support solidify and offset traceback

      const [deployer] = await ethers.getSigners();
      const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REGISTRY_ADDRESS, deployer);

      //      const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate")
      //      const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("postUpdate", [])
      //      const updateTx = await ArkreenRECIssuanceFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
      const updateTx = await ArkreenRECIssuanceFactory.upgradeTo(NEW_IMPLEMENTATION)
      await updateTx.wait()

      console.log("callData, update", updateTx)
      console.log("ArkreenRECIssuance Updated to %s: ", hre.network.name, 
                            ArkreenRECIssuanceFactory.address, NEW_IMPLEMENTATION);
  } 
};

func.tags = ["RECIssueU"];

export default func;
