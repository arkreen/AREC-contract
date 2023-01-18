import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  console.log("Update ArkreenRECToken: ", CONTRACTS.RECToken, deployer.address);  

  if(hre.network.name === 'matic_test') {
      const RECTOKEN_ADDRESS    = "0xb0c9dd915f62d0a37792fd2ce497680e909d8c0f"      // Need to check: Simulation mode
//    const RECTOKEN_ADDRESS    = "0xd1348bb43dbf51a2446db6e40de5f6c178cb2d47"      // Need to check: MATIC Testnet

//    const NEW_IMPLEMENTATION  = "0x87f36c015a23a9e0f15fcb7f62d566a8f4a16209"      // 1.Old implemenation
//    const NEW_IMPLEMENTATION  = "0x67b31C71c4E438a04dDA41dBCf5d2F174d43d69B"      // 2. Add Solidify 
//    const NEW_IMPLEMENTATION  = "0x6DAf30bF36379641E73Ebc6b4755E28bC97091D3"      // 3. make fields public //both simu and testnet
//    const NEW_IMPLEMENTATION  = "0xc0e5543d8bb04dfa26e176dbb1418da923f3981d"      // 4. Add numberAREC to Solidify event
//    const NEW_IMPLEMENTATION  = "0xb2d9199071DC648c5F0D7F9e5c8e7c7e7d2e1e6B"      // 5. Return numberAREC in Solidify
      const NEW_IMPLEMENTATION  = "0x319334463C5d18D5bD45cC6d6eB27216F712906E"      // 6. Add getARECInfo(uint256 number)

      const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(RECTOKEN_ADDRESS, deployer);

//    const callData = ArkreenRECTokenFactory.interface.encodeFunctionData("postUpdate")
//    const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
//    const updateTx = await ArkreenRECTokenFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
      
      const updateTx = await  ArkreenRECTokenFactory.upgradeTo(NEW_IMPLEMENTATION)
      await updateTx.wait()

      console.log("callData, update", updateTx)
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