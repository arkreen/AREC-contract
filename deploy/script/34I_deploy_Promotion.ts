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
      arkreenPromotionAddress   = "0x88D1D2Ec7544Bc3Dede2956487B1Bf28E911F13C"

 /*     
      amountAKREPerRM = expandTo18Decimals(5000)      
      priceRemoteMiner = expandTo18Decimals(5000)      
      amountAKREPerART = expandTo18Decimals(5000)      
      priceARTToken = expandTo18Decimals(5000)      
      startTime = 1766217600
      endTime = 1766822400
*/
      amountAKREPerRM = expandTo18Decimals(5000)      
      priceRemoteMiner = expandTo18Decimals(6000)      
      amountAKREPerART = expandTo18Decimals(5000)      
      priceARTToken = expandTo18Decimals(6000)      
      startTime = 0
      endTime = 0

      const arkreenPromotion = ArkreenPromotion__factory.connect(arkreenPromotionAddress, deployer);
    
      // 2024/09/2: Polygon mainnet
      const changePromotionConfigTx = await arkreenPromotion.changePromotionConfig(
                amountAKREPerRM, priceRemoteMiner, amountAKREPerART, priceARTToken, startTime, endTime,
                {gasPrice: defaultGasPrice})

      await changePromotionConfigTx.wait()                

      console.log("ArkreenPromotion changePromotionConfig", arkreenPromotion.address, changePromotionConfigTx)
    } 
};

// 2024/09/16: Call changePromotionConfig
// yarn deploy:matic_test:ArkreenPromotionI       : Amoy testnet (Dev Anv)

// 2024/12/19: Call changePromotionConfig
// yarn deploy:matic:ArkreenPromotionI            : Polygon mainnet

// 2024/12/19: Call changePromotionConfig         : Close Promotion
// yarn deploy:matic:ArkreenPromotionI            : Polygon mainnet

func.tags = ["ArkreenPromotionI"];

export default func;
