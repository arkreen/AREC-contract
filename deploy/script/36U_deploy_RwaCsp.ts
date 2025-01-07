import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { RwaCSP__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
    
    if(hre.network.name === 'matic_test')  {
      // 2025/01/07: Support withdrawing to diffrent receiver
      const rwaCSP = "0xDd0597927E27d5870198Be48C594F7155D3904EB"
      const NEW_IMPLEMENTATION ="0x7AE7C5CF040C2DFB08530306F72B1BFecfF72138"        // 2025/01/01, Support withdrawing to diffrent receiver

      console.log("Updating RwaCSP: ", rwaCSP, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const RwaCSPFactory = RwaCSP__factory.connect(rwaCSP, deployer);

      const updateTx = await RwaCSPFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("RwaCSP Upgraded: ", hre.network.name, RwaCSPFactory.address);

    } else if(hre.network.name === 'matic')  {
      // 2025/01/07: Support withdrawing to diffrent receiver
      const rwaCSP = "0xDd0597927E27d5870198Be48C594F7155D3904EB"
      const NEW_IMPLEMENTATION ="0x7AE7C5CF040C2DFB08530306F72B1BFecfF72138" 

      console.log("Updating RwaCSP: ", rwaCSP, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const RwaCSPFactory = RwaCSP__factory.connect(rwaCSP, deployer);

      const updateTx = await RwaCSPFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("RwaCSP Upgraded: ", hre.network.name, RwaCSPFactory.address);
    } 
};

// 2025/01/07
// yarn deploy:matic_test:RwaCSPU:  Amoy testnet, Support withdrawing to diffrent receiver
// Proxy:                 0xDd0597927E27d5870198Be48C594F7155D3904EB
// Implementaion:         0x7AE7C5CF040C2DFB08530306F72B1BFecfF72138

func.tags = ["RwaCSPU"];

export default func;
