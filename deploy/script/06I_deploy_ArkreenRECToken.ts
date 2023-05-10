import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  console.log("Update ArkreenRECToken: ", CONTRACTS.RECToken, deployer.address);  

  if(hre.network.name === 'matic') {
    const RECTOKEN_ADDRESS    = "0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF"        // Need to check
    const AREC_ISSUE_ADDRESS  = "0xFedD52848Cb44dcDBA95df4cf2BCBD71D58df879"
  
    const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(RECTOKEN_ADDRESS, deployer);

    const updateTx = await  ArkreenRECTokenFactory.setIssuerREC(AREC_ISSUE_ADDRESS)
    await updateTx.wait()

    console.log("callData, update", updateTx)
    console.log("ArkreenRECToken Updated to %s: ", hre.network.name, ArkreenRECTokenFactory.address);
  } 
};

// 2023/05/10: Call setIssuerREC to update AREC_ISSUE_ADDRESS: 0xFedD52848Cb44dcDBA95df4cf2BCBD71D58df879
// yarn deploy:matic:RECTokenI

func.tags = ["RECTokenI"];

export default func;