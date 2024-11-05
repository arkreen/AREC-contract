import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { MinerStaking__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
    
    if(hre.network.name === 'matic_test')  {
      // 2024/10/18: Add deadline in slash
      const minerStaking = "0x8FCa4A8fB8a14Fb1F4BC64F48f36c528Dd724C13"
      //const NEW_IMPLEMENTATION ="0x4400813481fDcd24578f25780b0057326dD47879"
      //const NEW_IMPLEMENTATION ="0xE528D9359e2B853a5963B0DD614499c12A83b2Ae"      // 2024/11/05,  Change AKRE token
      const NEW_IMPLEMENTATION ="0x93055D0c3c43561D7889C9dE196f7EE6f1cd0e77"        // 2024/11/05B,  Change AKRE token controlled by Owner
     
      console.log("Updating MinerStaking: ", minerStaking, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const MinerStakingFactory = MinerStaking__factory.connect(minerStaking, deployer);

      const updateTx = await MinerStakingFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("MinerStaking Upgraded: ", hre.network.name, MinerStakingFactory.address);

    } else if(hre.network.name === 'matic')  {
      const minerStaking = "0x3221F5818A5CF99e09f5BE0E905d8F145935e3E0"
      const NEW_IMPLEMENTATION ="0x7ea0fE45cA251EB7aFe633D70361F7D5548475aB"

      console.log("Updating MinerStaking: ", minerStaking, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const MinerStakingFactory = MinerStaking__factory.connect(minerStaking, deployer);
      const updateTx = await MinerStakingFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("minerStaking is upgraded: ", hre.network.name, MinerStakingFactory.address);
    } 
};

// 2024/10/18
// yarn deploy:matic_test:MinerStakingU:  Amoy testnet, Add dealine in Slash method
// Proxy:                 0x8FCa4A8fB8a14Fb1F4BC64F48f36c528Dd724C13
// Implementaion:         0x4400813481fDcd24578f25780b0057326dD47879

// 2024/11/5
// yarn deploy:matic_test:MinerStakingU:  Amoy testnet, Add dealine in Slash method
// Proxy:                 0x8FCa4A8fB8a14Fb1F4BC64F48f36c528Dd724C13
// Implementaion:         0xE528D9359e2B853a5963B0DD614499c12A83b2Ae

// 2024/11/5B
// yarn deploy:matic_test:MinerStakingU:  Amoy testnet, Add dealine in Slash method
// Proxy:                 0x8FCa4A8fB8a14Fb1F4BC64F48f36c528Dd724C13
// Implementaion:         0x93055D0c3c43561D7889C9dE196f7EE6f1cd0e77

func.tags = ["MinerStakingU"];

export default func;
