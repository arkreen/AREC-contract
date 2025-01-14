import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { ArkreenPromotion__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
    
    if(hre.network.name === 'matic_test')  {
      // 2024/12/17: Fix bug
      const arkreenPromotion = "0x2C870f4e1B716788bB7e75Ae990583A801564dF0"
      //const NEW_IMPLEMENTATION ="0xBB17d9b933F631024cA4cF45391E7302CD527489"      // 2024/12/17, Fix Bug
      //const NEW_IMPLEMENTATION ="0xC88535788B4e45966c529D8b3FAd027d1E2d5a0a"      // 2024/12/17, getPromotionConfig and getPromotionUserStatus
      const NEW_IMPLEMENTATION ="0xBDf492DA550518eFEAB7d3C724110290923986b9"        // 2024/12/17, add calling RemoteMinerOnboardAuthority to Miner Contract

      console.log("Updating ArkreenPromotion: ", arkreenPromotion, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const ArkreenPromotionFactory = ArkreenPromotion__factory.connect(arkreenPromotion, deployer);

      const updateTx = await ArkreenPromotionFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("ArkreenPromotion Upgraded: ", hre.network.name, ArkreenPromotionFactory.address);

    } else if(hre.network.name === 'matic')  {
      const arkreenPromotion = "0x3221F5818A5CF99e09f5BE0E905d8F145935e3E0"
      const NEW_IMPLEMENTATION ="0x7ea0fE45cA251EB7aFe633D70361F7D5548475aB"

      console.log("Updating ArkreenPromotion: ", arkreenPromotion, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const MinerStakingFactory = ArkreenPromotion__factory.connect(arkreenPromotion, deployer);
      const updateTx = await MinerStakingFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("ArkreenPromotion is upgraded: ", hre.network.name, MinerStakingFactory.address);
    } 
};

// 2024/12/17
// yarn deploy:matic_test:ArkreenPromotionU:  Amoy testnet, Fix Bug
// Proxy:                 0x2C870f4e1B716788bB7e75Ae990583A801564dF0
// Implementaion:         0xBB17d9b933F631024cA4cF45391E7302CD527489

// 2024/12/17
// yarn deploy:matic_test:ArkreenPromotionU:  Amoy testnet, add getPromotionConfig and getPromotionUserStatus
// Proxy:                 0x2C870f4e1B716788bB7e75Ae990583A801564dF0
// Implementaion:         0xC88535788B4e45966c529D8b3FAd027d1E2d5a0a

// 2024/12/17
// yarn deploy:matic_test:ArkreenPromotionU:  Amoy testnet, add calling RemoteMinerOnboardAuthority to Miner Contract
// Proxy:                 0x2C870f4e1B716788bB7e75Ae990583A801564dF0
// Implementaion:         0xBDf492DA550518eFEAB7d3C724110290923986b9

func.tags = ["ArkreenPromotionU"];

export default func;
