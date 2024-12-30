import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { KWhToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(160_000_000_000)

    let gbtc : string = ''
    let akre: string = ''
    
    //function initialize(address gbtc, address akre)
    if(hre.network.name === 'matic_test')  {
      // 2024/06/15: GreenBTCV2 on Amoy testnet                        
      const GreenBTCGift_PROXY_ADDRESS  = "0x644d45543027E72Ecb653732c1363584710FF609"  // 2024/06/15 
      const NEW_IMPLEMENTATION          = "0x94c0F710C34990772eaDe1818EBF2540fd7106e9"  // 2024/05/23E: 

      console.log("Updating GreenBTCGift: ", GreenBTCGift_PROXY_ADDRESS, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
      const GreenBTCGiftFactory = KWhToken__factory.connect(GreenBTCGift_PROXY_ADDRESS, deployer);
      const updateTx = await GreenBTCGiftFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("USDT deployed to %s: ", hre.network.name, GreenBTCGiftFactory.address);

    } else if(hre.network.name === 'matic')  {
      // 2024/12/25: Upgrade KWhToken                     
      const KWhToken_PROXY_ADDRESS  = "0x5740A27990d4AaA4FB83044a6C699D435B9BA6F1"      // 2024/12/25 
      const NEW_IMPLEMENTATION          = "0x399b885E8428ADa05945Ac5f28FAfac5Cc036BCA"  // 2024/12/25 

      console.log("Updating KWhToken: ", KWhToken_PROXY_ADDRESS, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
      const KWhTokenFactory = KWhToken__factory.connect(KWhToken_PROXY_ADDRESS, deployer);
      const updateTx = await KWhTokenFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("KWhToken Upgraded to %s: ", hre.network.name, KWhTokenFactory.address);
    } 
    
};

// 2024/06/15
// yarn deploy:matic:WKHU    : Polygon mainnet
// Proxy:                 0x5740A27990d4AaA4FB83044a6C699D435B9BA6F1
// Implementaion:         0x399b885E8428ADa05945Ac5f28FAfac5Cc036BCA

func.tags = ["WKHU"];

export default func;
