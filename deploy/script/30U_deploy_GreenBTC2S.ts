import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { GreenBTC2S__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(30_000_000_000) : BigNumber.from(50_000_000_000)

    let gbtc : string = ''
    let akre: string = ''
    
    //function initialize(address gbtc, address akre)
    if(hre.network.name === 'matic_test')  {
      // 2024/06/15: GreenBTCV2 on Amoy testnet                        
      const greenPowerAddress = "0x3221F5818A5CF99e09f5BE0E905d8F145935e3E0"
      const NEW_IMPLEMENTATION ="0xFaCb924cd91EA15CaD4524f52C68b91530288c4d"

      console.log("Updating GreenBTC2S: ", greenPowerAddress, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const GreenBTC2SFactory = GreenBTC2S__factory.connect(greenPowerAddress, deployer);
      const updateTx = await GreenBTC2SFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("USDT deployed to %s: ", hre.network.name, GreenBTC2SFactory.address);

    } else if(hre.network.name === 'matic')  {
      // 2024/10/13: GreenBTC2S on Polygon mainnet
      const greenBTC2S = "0x3221F5818A5CF99e09f5BE0E905d8F145935e3E0"
      //const NEW_IMPLEMENTATION ="0xFaCb924cd91EA15CaD4524f52C68b91530288c4d"
      const NEW_IMPLEMENTATION ="0x7ea0fE45cA251EB7aFe633D70361F7D5548475aB"

      console.log("Updating GreenBTC2S: ", greenBTC2S, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const GreenBTC2SFactory = GreenBTC2S__factory.connect(greenBTC2S, deployer);
      const updateTx = await GreenBTC2SFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("greenBTC2S is upgraded: ", hre.network.name, GreenBTC2SFactory.address);
    } 
};

// 2024/10/13
// yarn deploy:matic:GreenBTC2SU:  Polygon mainnet
// Proxy:                 0x3221F5818A5CF99e09f5BE0E905d8F145935e3E0
// Implementaion:         0xFaCb924cd91EA15CaD4524f52C68b91530288c4d

// 2024/10/14
// yarn deploy:matic:GreenBTC2SU:  Polygon mainnet
// Proxy:                 0x3221F5818A5CF99e09f5BE0E905d8F145935e3E0
// Implementaion:         0x7ea0fE45cA251EB7aFe633D70361F7D5548475aB

func.tags = ["GreenBTC2SU"];

export default func;
