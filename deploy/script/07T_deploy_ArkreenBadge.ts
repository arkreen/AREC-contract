import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenBadge__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerAddress } = await getNamedAccounts();

    console.log("Deploying Updated  ArkreenBadge: ", CONTRACTS.RECRetire, deployerAddress);  
  
    if(hre.network.name === 'matic_test') {
//      const PROXY_ADDRESS = "0x5C653b445BE2bdEB6f8f3CD099FC801865Cab835"       // Need to check
//      const NEW_IMPLEMENTATION = '0x6f4fff7faa238cd68f03de75b8906e23dbd95f30'   // Need to check

        const PROXY_ADDRESS = "0x5C653b445BE2bdEB6f8f3CD099FC801865Cab835"       // Need to check
        const NEW_IMPLEMENTATION = '0xA82E33A80f8c6A0dC66678956F8dC3b27928F036'   // Update to support SBT

        const [deployer] = await ethers.getSigners();
        const  ArkreenBadgeFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS, deployer);

//      const callData =  ArkreenBadgeFactory.interface.encodeFunctionData("postUpdate")
////    const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
//      const updateTx = await  ArkreenBadgeFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)

        const updateTx = await  ArkreenBadgeFactory.upgradeTo(NEW_IMPLEMENTATION)
        await updateTx.wait()

        console.log("callData, update", updateTx)
        console.log(" ArkreenBadge deployed to %s: ", hre.network.name,  ArkreenBadgeFactory.address);
    } 

    if(hre.network.name === 'matic') {
      const PROXY_ADDRESS = "0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337"       // Need to check
      const NEW_IMPLEMENTATION = '0xA82E33A80f8c6A0dC66678956F8dC3b27928F036'   // Update to support SBT
      
      const [deployer] = await ethers.getSigners();

      const feeData = await deployer.getFeeData()
      const gasPrice = await deployer.getGasPrice()  
      
      console.log('feeData, gasPrice', feeData, gasPrice)

//      const  ArkreenBadgeFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS, deployer);
//      const updateTx = await  ArkreenBadgeFactory.upgradeTo(NEW_IMPLEMENTATION)
//      await updateTx.wait()
      
//      console.log("callData, update", updateTx)
//      console.log(" ArkreenBadge deployed to %s: ", hre.network.name,  ArkreenBadgeFactory.address);
    } 
};

func.tags = ["RECBadgeT"];

export default func;
