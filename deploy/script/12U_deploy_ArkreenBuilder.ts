import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenBuilder__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  
  if(hre.network.name === 'matic_test') {
    
    const ESG_BUILDER_ADDRESS = "0xA05A9677a9216401CF6800d28005b227F7A3cFae"          // ArkreenBuilder
    // const NEW_IMPLEMENTATION = "0x2D597ba4358638fFED7918994AaC12c535A93F89"        // 2023/02/25: Initial version
    // const NEW_IMPLEMENTATION = "0x16dB479F500aeE6C1683955e0E34394fe81Be12d"        // 2023/03/14: Upgrade to support sales bank
    const NEW_IMPLEMENTATION = "0xd320E323293d092d3dcC3533AF477cD14976C31B"           // 2023/10/11: Upgrade to support directly using ART in AREC Builder

    console.log("Updating HashKey ESG Builder: ", ESG_BUILDER_ADDRESS);  

    const [deployer] = await ethers.getSigners();
    const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(ESG_BUILDER_ADDRESS, deployer);
    const updateTx = await ArkreenBuilderFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

  /*
    const ARKREEN_REC_BANK = "0x7ee6D2A14d6Db71339a010d44793B27895B36d50"
    const callData = ArkreenBuilderFactory.interface.encodeFunctionData("postUpdate", [ARKREEN_REC_BANK])
    const updateTx = await ArkreenBuilderFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("HashKey ESG BTC Updated: ", hre.network.name, ArkreenBuilderFactory.address, NEW_IMPLEMENTATION);
  */    
  } 
};

// 2023/10/11: 
// yarn deploy:matic_test:ABuilderU
// Upgrade to implementation: 0xd320E323293d092d3dcC3533AF477cD14976C31B

export default func;
func.tags = ["ABuilderU"];


