import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  console.log("Update ArkreenRECToken: ", CONTRACTS.RECToken, deployer.address);  

  if(hre.network.name === 'matic_test') {
      const RECTOKEN_ADDRESS    = "0xb0c9dd915f62d0a37792fd2ce497680e909d8c0f"        // Need to check
//    const NEW_IMPLEMENTATION  = "0x87f36c015a23a9e0f15fcb7f62d566a8f4a16209"        // 1.Old implemenation
//    const NEW_IMPLEMENTATION  = "0x67b31C71c4E438a04dDA41dBCf5d2F174d43d69B"      // 2. Add Solidify 
      const NEW_IMPLEMENTATION  = "0x6DAf30bF36379641E73Ebc6b4755E28bC97091D3"      // 3. make fields public
    
      const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(RECTOKEN_ADDRESS, deployer);

      const callData = ArkreenRECTokenFactory.interface.encodeFunctionData("postUpdate")
//      const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
      const updateTx = await ArkreenRECTokenFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
      await updateTx.wait()

      console.log("callData, update", callData, updateTx)
      console.log("ArkreenRECToken Updated to %s: ", hre.network.name, ArkreenRECTokenFactory.address);
  } 

  if(hre.network.name === 'matic') {
    const RECTOKEN_ADDRESS    = "0x815bFE3aaCF765c9E0A4DdEb98Ad710a4Fb860d3"        // Need to check
    //  const NEW_IMPLEMENTATION  = "0xbdb320004dd108bd6bbba948db992f7b4b3bdbf4"    // 1. Old implemenation
    const NEW_IMPLEMENTATION  = "0x1356Dc92E42a8fB17f2A5AE747543E4d3ADED899"        // 2. Add solidity and offset traceback
  
    const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(RECTOKEN_ADDRESS, deployer);

    //   const callData = ArkreenRECTokenFactory.interface.encodeFunctionData("postUpdate")
    //   const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
    //   const updateTx = await ArkreenRECTokenFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)

    const updateTx = await  ArkreenRECTokenFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    console.log("callData, update", updateTx)
    console.log("ArkreenRECToken Updated to %s: ", hre.network.name, ArkreenRECTokenFactory.address);
} 

};

func.tags = ["RECTokenU"];

export default func;