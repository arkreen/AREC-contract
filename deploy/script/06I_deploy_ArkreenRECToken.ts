import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  console.log("Update ArkreenRECToken: ", CONTRACTS.RECToken, deployer.address);  

  if(hre.network.name === 'matic_test') {
    // const ART_ADDRESS    = "0xb0c9dD915f62d0A37792FD2ce497680E909D8c0F"        // ART simu: Need to check
    const ART_ADDRESS = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"              // HART simu
    // const AREC_ISSUE_ADDRESS  = "0xFedD52848Cb44dcDBA95df4cf2BCBD71D58df879"
    // const RECTOKEN_ADDRESS    = "0xb0c9dD915f62d0A37792FD2ce497680E909D8c0F"  // ART simu: Need to check
    // const BUILDER_ADDRESS   = "0xA05A9677a9216401CF6800d28005b227F7A3cFae"    // Action Builder address: Simu
    const ratioFeeToSolidify = 1000                                              // Ratio of the fee to solidify

    const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(ART_ADDRESS, deployer);

    // Set ArkreenBuilder address to the ART/HART token contract: 2023/08/08
    // const setClimateBuilderTx = await ArkreenRECTokenFactory.setClimateBuilder( BUILDER_ADDRESS as string)
    // await setClimateBuilderTx.wait()

    // console.log("ArkreenRECToken Tx:", setClimateBuilderTx)
    // console.log(" Set ArkreenBuilder address to the ART/HART token contract: ", hre.network.name, BUILDER_ADDRESS, ART_ADDRESS );

    // Set setRatioFeeToSolidify to the ART/HART token contract: 2023/08/17
    const setRatioFeeToSolidifyTx = await ArkreenRECTokenFactory.setRatioFeeToSolidify(ratioFeeToSolidify)
    await setRatioFeeToSolidifyTx.wait()

    console.log("ArkreenRECToken Tx:", setRatioFeeToSolidifyTx)
    console.log("Set setRatioFeeToSolidify to the ART/HART token contract: ", hre.network.name, ART_ADDRESS, ratioFeeToSolidify);

    //const updateTx = await  ArkreenRECTokenFactory.setClimateBuilder(AREC_ISSUE_ADDRESS)
    //await updateTx.wait()
  }
  
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

// 2023/08/08: Call setClimateBuilder to update climateBuilder: 0xA05A9677a9216401CF6800d28005b227F7A3cFae
// yarn deploy:matic_test:RECTokenI

// 2023/08/17: Call setRatioFeeToSolidify on simu env
// yarn deploy:matic_test:RECTokenI

func.tags = ["RECTokenI"];

export default func;