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

      const setGreenBTCTx = await greenBTCGift.setGreenBTC(GreenBTCAddress, {gasPrice: defaultGasPrice})
      await setGreenBTCTx.wait()
  
      console.log("setGreenBTC %s: ", hre.network.name, greenBTCGift.address);

    } else if(hre.network.name === 'matic')  {
      gbtc = ""
      akre = ""
    } 
    
};

// 2024/06/15
// yarn deploy:matic_test:greenBTCGiftI    : Amoy testnet (Dev Anv)
// Proxy:                 0x644d45543027E72Ecb653732c1363584710FF609
// Implementaion:         0x94c0F710C34990772eaDe1818EBF2540fd7106e9

func.tags = ["greenBTCGiftI"];

export default func;
