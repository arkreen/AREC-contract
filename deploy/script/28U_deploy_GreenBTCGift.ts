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
      // 2024/06/15: GreenBTCV2 on Amoy testnet                        
      const GreenBTCGift_PROXY_ADDRESS  = "0x644d45543027E72Ecb653732c1363584710FF609"  // 2024/06/15 
      const NEW_IMPLEMENTATION          = "0x94c0F710C34990772eaDe1818EBF2540fd7106e9"  // 2024/05/23E: 

      console.log("Updating GreenBTCGift: ", GreenBTCGift_PROXY_ADDRESS, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
      const GreenBTCGiftFactory = GreenBTCGift__factory.connect(GreenBTCGift_PROXY_ADDRESS, deployer);
      const updateTx = await GreenBTCGiftFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("USDT deployed to %s: ", hre.network.name, GreenBTCGiftFactory.address);

    } else if(hre.network.name === 'matic')  {
      gbtc = ""
      akre = ""
    } 

    
};

// 2024/06/15
// yarn deploy:matic_test:greenBTCGiftU    : Amoy testnet (Dev Anv)
// Proxy:                 0x644d45543027E72Ecb653732c1363584710FF609
// Implementaion:         0x94c0F710C34990772eaDe1818EBF2540fd7106e9


func.tags = ["greenBTCGiftU"];

export default func;
