import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenBuilder__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(50_000_000_000)
 
  if(hre.network.name === 'matic_test') {
    
    // const ESG_BUILDER_ADDRESS = "0xA05A9677a9216401CF6800d28005b227F7A3cFae"       // ArkreenBuilder
    const ESG_BUILDER_ADDRESS   = "0x12De6c1FB46B64e3DA5bFDD274E98B9103353dF7"        // ArkreenBuilder on Polygon Amoy

    // const NEW_IMPLEMENTATION = "0x2D597ba4358638fFED7918994AaC12c535A93F89"        // 2023/02/25: Initial version
    // const NEW_IMPLEMENTATION = "0x16dB479F500aeE6C1683955e0E34394fe81Be12d"        // 2023/03/14: Upgrade to support sales bank
    // const NEW_IMPLEMENTATION = "0xd320E323293d092d3dcC3533AF477cD14976C31B"        // 2023/10/11: Upgrade to support directly using ART in AREC Builder
    // const NEW_IMPLEMENTATION = "0x4aF1eADF9f2f51395Fc2329ac0ab554DBb7EBF57"        // 2023/12/05: Overpayemnt payback target address is configed with modeAction
    // const NEW_IMPLEMENTATION = "0x5054ce5432f3597dAFa90b246253F6433b56e3a9"        // 2024/01/27: Upgrade to support UniV3 and Charging offset fee
    // const NEW_IMPLEMENTATION = "0x93eFC409Ff44788E8b1DAF395F46965046cAe84B"        // 2024/05/06: Upgrade to support GreenBTC discount
    const NEW_IMPLEMENTATION = "0xbF6308e2564FDB7F98C0578A35fC2ecCc14432db"           // 2024/06/01: Upgrade to fix the bug in ArkreenBuilder to send bought ART to greenBTC

    console.log("Updating HashKey ESG Builder: ", ESG_BUILDER_ADDRESS);  

    const [deployer] = await ethers.getSigners();
    const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(ESG_BUILDER_ADDRESS, deployer);
    const updateTx = await ArkreenBuilderFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

  /*
    const ARKREEN_REC_BANK = "0x7ee6D2A14d6Db71339a010d44793B27895B36d50"
    const callData = ArkreenBuilderFactory.interface.encodeFunctionData("postUpdate", [ARKREEN_REC_BANK])
    const updateTx = await ArkreenBuilderFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    await updateTx.wait()
  */
    console.log("Update Trx:", updateTx)
    console.log("HashKey ESG BTC Updated: ", hre.network.name, ArkreenBuilderFactory.address, NEW_IMPLEMENTATION);
      
  } 

  if(hre.network.name === 'matic') {
    
    const ESG_BUILDER_ADDRESS = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"          // ArkreenBuilder
    // const NEW_IMPLEMENTATION = "0x076bB3051f273Ea6f6AA76e41797241124B3B157"        // 2023/10/30: Upgrade to support ART offset directly
    // const NEW_IMPLEMENTATION = "0x3E458Ff2c39fe10636003e02C1DdA387b455Ee6F"        // 2024/02/03: Upgrade to support UniV3 and Charging offset fee
    const NEW_IMPLEMENTATION = "0xC3b89B7e71D36cf90bD30ED0e79A97738FD59Fd3"        // 2024/05/06: Upgrade to support ART subsidy
    //const NEW_IMPLEMENTATION = "0xADA5FDC7c1258dCC8F47BF5204BD967e0466c290"           // 2024/06/01: Deployed on Polygon mainnet to fix the bug in ArkreenBuilder to send bought ART to greenBTC

    console.log("Updating ESG Builder: ", ESG_BUILDER_ADDRESS);  

    const [deployer] = await ethers.getSigners();
    const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(ESG_BUILDER_ADDRESS, deployer);
    const updateTx = await ArkreenBuilderFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("HashKey ESG BTC Updated: ", hre.network.name, ArkreenBuilderFactory.address, NEW_IMPLEMENTATION);
      
  } 
 
};

// 2023/10/11: 
// yarn deploy:matic_test:ABuilderU
// Upgrade to implementation: 0xd320E323293d092d3dcC3533AF477cD14976C31B

// 2023/10/30: 
// yarn deploy:matic:ABuilderU
// Upgrade to implementation: 0x076bB3051f273Ea6f6AA76e41797241124B3B157

// 2023/12/05: 
// yarn deploy:matic_test:ABuilderU
// Upgrade to implementation: 0x4aF1eADF9f2f51395Fc2329ac0ab554DBb7EBF57

// 2024/01/27: 
// yarn deploy:matic_test:ABuilderU
// Upgrade to implementation: 0x5054ce5432f3597dAFa90b246253F6433b56e3a9

// 2024/02/03: Upgrade on Matic Mainnet
// yarn deploy:matic:ABuilderU
// Upgrade to implementation: 0x3E458Ff2c39fe10636003e02C1DdA387b455Ee6F

// 2024/05/06: Upgrade on Polygon Amoy
// yarn deploy:matic_test:ABuilderU
// Upgrade to implementation: 0x93eFC409Ff44788E8b1DAF395F46965046cAe84B

// 2024/06/01: Upgrade on Polygon mainnet
// yarn deploy:matic:ABuilderU
// Upgrade to implementation: 0xADA5FDC7c1258dCC8F47BF5204BD967e0466c290

// 2024/06/01A: Upgrade on Polygon mainnet
// yarn deploy:matic_test:ABuilderU
// Upgrade to implementation: 0xbF6308e2564FDB7F98C0578A35fC2ecCc14432db

// 2024/08/08: Return back to 0xC3b89B7e71D36cf90bD30ED0e79A97738FD59Fd3
// yarn deploy:matic:ABuilderU
// Upgrade to implementation: 0xC3b89B7e71D36cf90bD30ED0e79A97738FD59Fd3

export default func;
func.tags = ["ABuilderU"];
