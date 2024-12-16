import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";
import { ArkreenPromotion__factory } from "../../typechain";
import { ethers } from "hardhat";

import { expandTo18Decimals } from '../../test/utils/utilities'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

    let arkreenPromotionAddress
    let amountAKREPerRM 
    let priceRemoteMiner
    let amountAKREPerART
    let priceARTToken
    let startTime 
    let endTime 

    if(hre.network.name === 'matic_test')  {
      // 2024/12/16: Amoy testnet                        
      arkreenPromotionAddress   = "0x2C870f4e1B716788bB7e75Ae990583A801564dF0"        // 2024/12/16
      amountAKREPerRM = expandTo18Decimals(2000)      
      priceRemoteMiner = expandTo18Decimals(3000)      
      amountAKREPerART = expandTo18Decimals(3000)      
      priceARTToken = expandTo18Decimals(5000)      
      startTime = 1734364200
      endTime = 1734595200

      const arkreenPromotion = ArkreenPromotion__factory.connect(arkreenPromotionAddress, deployer);
    
      // 2024/12/16: Amoy testnet
      await arkreenPromotion.changePromotionConfig(
                amountAKREPerRM, priceRemoteMiner, amountAKREPerART, priceARTToken, startTime, endTime,
                {gasPrice: defaultGasPrice})

      console.log("ArkreenPromotion changePromotionConfig", arkreenPromotion.address)
      
    } else if(hre.network.name === 'matic')  {
      arkreenPromotionAddress   = "0x2C870f4e1B716788bB7e75Ae990583A801564dF0"

      amountAKREPerRM = expandTo18Decimals(5000)      
      priceRemoteMiner = expandTo18Decimals(5000)      
      amountAKREPerART = expandTo18Decimals(5000)      
      priceARTToken = expandTo18Decimals(5000)      
      startTime = 1734364200
      endTime = 1734595200

      const arkreenPromotion = ArkreenPromotion__factory.connect(arkreenPromotionAddress, deployer);
    
      // 2024/09/2: Polygon mainnet
      await arkreenPromotion.changePromotionConfig(
                amountAKREPerRM, priceRemoteMiner, amountAKREPerART, priceARTToken, startTime, endTime,
                {gasPrice: defaultGasPrice})

      console.log("ArkreenPromotion changePromotionConfig", arkreenPromotion.address)
    } 
};

// 2024/09/02: Call changePromotionConfig
// yarn deploy:matic_test:ArkreenPromotionI      : Amoy testnet (Dev Anv)

func.tags = ["ArkreenPromotionI"];

export default func;
