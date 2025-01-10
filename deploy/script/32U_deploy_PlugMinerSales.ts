import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { PlugMinerSales__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(60_000_000_000)
    
    if(hre.network.name === 'matic_test')  {
      // 2025/01/10: Update actionCspMiner
      const plugMinerSales = "0x1C326496695cFE4Dde70dd188F87Dc6c069778Af"
      const NEW_IMPLEMENTATION ="0x1b6209dFb258ba757066CC8BDa987d592962b375"      // 2025/01/10: Update actionCspMiner

      console.log("Updating plugMinerSales: ", plugMinerSales, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const plugMinerSalesFactory = PlugMinerSales__factory.connect(plugMinerSales, deployer);

      const updateTx = await plugMinerSalesFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("plugMinerSales Upgraded: ", hre.network.name, plugMinerSales);

    } else if(hre.network.name === 'matic')  {
      // 2025/01/10: Update actionCspMiner
      const plugMinerSales = "0x8E0b81E8400FF35B7A1af36A2031AeaD166D1594"
      const NEW_IMPLEMENTATION ="0x23D224309983ce2fC02535729420FED9462c3f63"    // 2025/01/10: Update actionCspMiner

      console.log("Updating plugMinerSales: ", plugMinerSales, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const plugMinerSalesFactory = PlugMinerSales__factory.connect(plugMinerSales, deployer);

      const updateTx = await plugMinerSalesFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("plugMinerSales is upgraded: ", hre.network.name, plugMinerSales);
    } 
};

// 2025/01/10
// yarn deploy:matic_test:PlugMinerSalesU    : Amoy testnet (Dev Anv)
// Implementaion:         0x1b6209dFb258ba757066CC8BDa987d592962b375

// 2025/01/10
// yarn deploy:matic:PlugMinerSalesU    : Polygon mainnet
// Implementaion:         0x23D224309983ce2fC02535729420FED9462c3f63

func.tags = ["PlugMinerSalesU"];

export default func;
