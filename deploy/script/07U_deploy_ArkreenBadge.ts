import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenBadge__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const [deployer] = await ethers.getSigners();

    console.log("Update ArkreenBadge: ", CONTRACTS.RECBadge, deployer.address);  
  
    if(hre.network.name === 'matic_test') {
//      Simulation test      
        const PROXY_ADDRESS = "0x5C653b445BE2bdEB6f8f3CD099FC801865Cab835"       // Need to check: Simu mode

//      const NEW_IMPLEMENTATION = '0x6f4fff7faa238cd68f03de75b8906e23dbd95f30'   // Need to check
//      const NEW_IMPLEMENTATION = '0xA82E33A80f8c6A0dC66678956F8dC3b27928F036'   // Update to support SBT
//      const NEW_IMPLEMENTATION = '0x8d58d9C7a2cB1A68F7F14BCd08CC735E3f12D267'   // Upgrade to support Offset trace back
        const NEW_IMPLEMENTATION = '0xD12E75566CeAa2bA669EDEbBA524359D7564b2c5'   // 2023/02/26: Upgrade to support HashKey ESG BTC

//      MATIC Test
//      const PROXY_ADDRESS = "0xe07968E3b0D64B99EA3653Dd925a850eBb9a3Bb9"       // Need to check: Matic testnet
//      const NEW_IMPLEMENTATION = '0xA82E33A80f8c6A0dC66678956F8dC3b27928F036'   // Update to support SBT

        const  ArkreenBadgeFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS, deployer);

//      const callData =  ArkreenBadgeFactory.interface.encodeFunctionData("postUpdate")
////    const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
//      const updateTx = await  ArkreenBadgeFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)

        const updateTx = await  ArkreenBadgeFactory.upgradeTo(NEW_IMPLEMENTATION)
        await updateTx.wait()

        console.log("callData, update", updateTx)
        console.log(" ArkreenBadge updated to %s: ", hre.network.name,  ArkreenBadgeFactory.address);
    } 

    if(hre.network.name === 'matic') {
      const PROXY_ADDRESS = "0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337"            // Need to check
      //  const NEW_IMPLEMENTATION = '0x504fb898a5dc3cf99f237e62228d09f52ee64a7f'   // Update to support SBT
      const NEW_IMPLEMENTATION = '0xc9fc3571e419d8d24826b9bb518a4420a89b30cf'       // Upgrade to support solidify and offset traceback
      
      const [deployer] = await ethers.getSigners();

      const feeData = await deployer.getFeeData()
      const gasPrice = await deployer.getGasPrice()  

/*
      const overrides = feeData.lastBaseFeePerGas ?
                          { maxFeePerGas: feeData.lastBaseFeePerGas.mul(140).div(100).gt(gasPrice) ?
                            feeData.lastBaseFeePerGas.mul(125).div(100) : gasPrice,
                            maxPriorityFeePerGas: feeData.lastBaseFeePerGas.mul(20).div(100) 
                          } : {gasPrice: gasPrice.mul(110).div(100)}
*/                                

      const overrides = feeData.lastBaseFeePerGas ?
                          { maxFeePerGas: feeData.lastBaseFeePerGas.mul(2).add(
                                            feeData.lastBaseFeePerGas.mul(20).div(100)),
                            maxPriorityFeePerGas: feeData.lastBaseFeePerGas.mul(20).div(100) 
                          } : {gasPrice: gasPrice.mul(120).div(100)}

      console.log('feeData, gasPrice', feeData, gasPrice, overrides)

      const  ArkreenBadgeFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS, deployer);
      
      const updateTx = await  ArkreenBadgeFactory.upgradeTo(NEW_IMPLEMENTATION)
      await updateTx.wait()
      
      console.log("callData, update", updateTx)
      console.log(" ArkreenBadge upgraded to %s: ", hre.network.name,  ArkreenBadgeFactory.address, NEW_IMPLEMENTATION);
    } 
};

func.tags = ["RECBadgeU"];

export default func;
