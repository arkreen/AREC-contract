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
//      const NEW_IMPLEMENTATION = '0xD12E75566CeAa2bA669EDEbBA524359D7564b2c5'   // 2023/02/26: Upgrade to support HashKey ESG BTC
//      const NEW_IMPLEMENTATION = '0x619f4a175B17C51cC11e7afB85e50a78b3899900'   // 2023/03/02: Upgrade to fix the Isser checking problem
//      const NEW_IMPLEMENTATION = '0x2cc8fFc86eAbdAA486d5408C8813813eb60b507a'   // 2023/03/03: Upgrade to trace back based on asset type while offsetting
//      const NEW_IMPLEMENTATION = '0x8Cd3372C871A6D9F8777B54483d6c27377C128eF'   // 2023/06/14: Upgrade to add ABI getOffsetDetails

//      MATIC Test
//      const PROXY_ADDRESS = "0xe07968E3b0D64B99EA3653Dd925a850eBb9a3Bb9"       // Need to check: Matic testnet
//      const PROXY_ADDRESS = "0x626f470Ae1427d01f0Fab4D79BC0c9748b07325d"       // Need to check: Matic testnet, Dev environment
//      const PROXY_ADDRESS = "0x70A7981b5c9ca1a4250A0C9BBDC2141752deBeeb"       // Need to check: Matic testnet, Pre-production

//      const NEW_IMPLEMENTATION = '0xA82E33A80f8c6A0dC66678956F8dC3b27928F036'   // Update to support SBT
//      const NEW_IMPLEMENTATION = '0x2cc8fFc86eAbdAA486d5408C8813813eb60b507a'   // 2023/03/28: Upgrade based on simu implementation
//      const NEW_IMPLEMENTATION = '0x8Cd3372C871A6D9F8777B54483d6c27377C128eF'   // 2023/06/14: Upgrade to add ABI getOffsetDetails
        const NEW_IMPLEMENTATION = '0x978808Ee68CB73188f8b5b33625a72F0bb1E5b5F'   // 2024/01/01: Deploy Badge contract supporting image url and event OffsetAttached

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
//    const PROXY_ADDRESS = "0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337"            // Need to check: Intenal test version
//    const NEW_IMPLEMENTATION = '0x504fb898a5dc3cf99f237e62228d09f52ee64a7f'       // Update to support SBT
//    const NEW_IMPLEMENTATION = '0xc9fc3571e419d8d24826b9bb518a4420a89b30cf'       // Upgrade to support solidify and offset traceback
//    const NEW_IMPLEMENTATION = '0x7Db78703C9B1561A5F0810c96449AFdE6eA9096b'       // 2023/03/03: Add a security check
//    const NEW_IMPLEMENTATION = '0xC51678BFd8e108F12CC3e5cb80F3067Bd6aEd323'       // 2023/04/02: Upgrade to support updateCID
//    const NEW_IMPLEMENTATION = '0x968848f24Aacfe2F3f2BD7169B7a1d5669091Eaf'       // 2023/04/18: Upgrade to remove the 3-day limitation of updateCertificate and SFT limitation
//    const NEW_IMPLEMENTATION = '0xE6264Ed46380BBf28AEF18ECB2fD1F4C92aa59F5'       // 2023/05/08: Re-Add SBT limitation
 
      const PROXY_ADDRESS = "0x1e5132495cdaBac628aB9F5c306722e33f69aa24"            // Need to check: Normal release
//    const NEW_IMPLEMENTATION = '0xE6264Ed46380BBf28AEF18ECB2fD1F4C92aa59F5'       // 2023/04/18: Upgrade to remove the 3-day limitation of updateCertificate
      const NEW_IMPLEMENTATION = '0x0A4E902c05F2eb26D6796e1649879c1201436E11'       // 2023/07/11: Upgrade to add ABI getOffsetDetails and add the 3-day limitation of updateCertificate
      
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

// 2023/03/28: Upgrade based on simu implementation

// 2023/04/02: yarn deploy:matic:RECBadgeU
// Upgrade to support updateCID on Matic mainnet trial version

// 2023/04/18: yarn deploy:matic:RECBadgeU
// Upgrade to remove the 3-day limitation of updateCertificate and SBT limitation (Intenal test version)

// 2023/04/18: yarn deploy:matic:RECBadgeU
// Upgrade to remove the 3-day limitation of updateCertificate (Normal release)

// 2023/05/08: yarn deploy:matic:RECBadgeU
// Re-add SBT limitation (Intenal test version)

// 2023/05/09: yarn deploy:matic:RECBadgeU (Intenal test version)
// Revert to 0x7Db78703C9B1561A5F0810c96449AFdE6eA9096b as new version is imcompatible

// 2023/06/14: yarn deploy:matic_test:RECBadgeU (Simu test version)
// Upgrade to add ABI getOffsetDetails

// 2023/06/17: yarn deploy:matic_test:RECBadgeU (Dev env version)
// Upgrade to add ABI getOffsetDetails

// 2023/06/17: yarn deploy:matic_test:RECBadgeU (Pre-Production)
// Upgrade to add ABI getOffsetDetails

// 2023/07/11: yarn deploy:matic:RECBadgeU (Release version)
// Upgrade to add ABI getOffsetDetails and add the 3-day limitation of updateCertificate

// 2024/01/01: yarn deploy:matic_test:RECBadgeU:  0x5C653b445BE2bdEB6f8f3CD099FC801865Cab835
// Deploy Badge contract supporting image url and event OffsetAttached

func.tags = ["RECBadgeU"];

export default func;
