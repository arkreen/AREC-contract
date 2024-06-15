import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { GreenBTCGift__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    let gbtc : string = ''
    let akre: string = ''
    
    //function initialize(address gbtc, address akre)
    if(hre.network.name === 'matic_test')  {
      // 2024/06/15: greenBTCGift on Amoy testnet                        
      const GreenBTCGift_PROXY_ADDRESS  = "0x644d45543027E72Ecb653732c1363584710FF609"  // 2024/06/15 
      const GreenBTCAddress             = "0x7670fE3CD59a43082214d070150Fa31D2054cB7a"  // 2024/06/15

      console.log("setGreenBTC: ", GreenBTCGift_PROXY_ADDRESS, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
      const greenBTCGift = GreenBTCGift__factory.connect(GreenBTCGift_PROXY_ADDRESS, deployer);

      /*
      // 2024/06/15
      const setGreenBTCTx = await greenBTCGift.setGreenBTC(GreenBTCAddress, {gasPrice: defaultGasPrice})
      await setGreenBTCTx.wait()
      */

      const AKRETokenAddress = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
      const USDTAddress = "0xc7767ae828E4830e2f800981E573f333d1E492b5"

      const value10000 = BigNumber.from(10000).mul(256).add(18)     // 10000 AKRE
      const value1000 = BigNumber.from(1000).mul(256).add(18)       // 1000 AKRE
      const value100 = BigNumber.from(100).mul(256).add(18)         // 100 AKRE
  
      const value500U = BigNumber.from(500).mul(256).add(6)         // 500 USDT
      const value300U = BigNumber.from(300).mul(256).add(6)         // 300 USDT
      const value100U = BigNumber.from(100).mul(256).add(6)         // 100 USDT
  
      const giftInfo1 = BigNumber.from(AKRETokenAddress).shl(96).add(value10000).toHexString()
      const giftInfo2 = BigNumber.from(AKRETokenAddress).shl(96).add(value1000).toHexString()
      const giftInfo3 = BigNumber.from(AKRETokenAddress).shl(96).add(value100).toHexString()
      const giftInfo81 = BigNumber.from(USDTAddress).shl(96).add(value500U).toHexString()
      const giftInfo82 = BigNumber.from(USDTAddress).shl(96).add(value300U).toHexString()
      const giftInfo83 = BigNumber.from(USDTAddress).shl(96).add(value100U).toHexString()

      await greenBTCGift.initGift(1, giftInfo1, {gasPrice: defaultGasPrice})
      await greenBTCGift.initGift(2, giftInfo2, {gasPrice: defaultGasPrice})
      await greenBTCGift.initGift(3, giftInfo3, {gasPrice: defaultGasPrice})
      await greenBTCGift.initGift(81, giftInfo81, {gasPrice: defaultGasPrice})
      await greenBTCGift.initGift(82, giftInfo82, {gasPrice: defaultGasPrice})
      await greenBTCGift.initGift(83, giftInfo83, {gasPrice: defaultGasPrice})
      
      console.log("setGreenBTC %s: ", hre.network.name, greenBTCGift.address);

    } else if(hre.network.name === 'matic')  {
      gbtc = ""
      akre = ""
    } 
    
};

// 2024/06/15
// yarn deploy:matic_test:greenBTCGiftI    : Amoy testnet (Dev Anv)
// Call:    setGreenBTC

// 2024/06/16
// yarn deploy:matic_test:greenBTCGiftI    : Amoy testnet (Dev Anv)
// Call:  initGift(1), initGift(2), initGift(3), initGift(81), initGift(82), initGift(83)

func.tags = ["greenBTCGiftI"];

export default func;
