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

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

    let gbtc : string = ''
    let akre: string = ''
    
    //function initialize(address gbtc, address akre)
    if(hre.network.name === 'matic_test')  {
      // 2024/10/14: fix the huge gas problem and makeGreenBoxLucky is added.
      const greenPowerAddress = "0x6729b2956e8Cf3d863517E4618C3d8722548D5C4"
      //const NEW_IMPLEMENTATION ="0xA649E9B886d2A1A1713268Ef6BC05E89A22a5436"
      const NEW_IMPLEMENTATION ="0x9ab6a15F421FA92eE8111cD096dc37C7859Cb4c9"

      console.log("Updating GreenBTC2S: ", greenPowerAddress, defaultGasPrice.toString());  

      const [deployer] = await ethers.getSigners();
 
      const GreenBTC2SFactory = GreenBTC2S__factory.connect(greenPowerAddress, deployer);

      //const callData = GreenBTC2SFactory.interface.encodeFunctionData("postUpdate")
      //const updateTx = await GreenBTC2SFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
      //await updateTx.wait()

      const updateTx = await GreenBTC2SFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("GreenBTC2S Upgraded: ", hre.network.name, GreenBTC2SFactory.address);

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

// 2024/10/14
// yarn deploy:matic_test:GreenBTC2SU:  Amoy testnet
// Proxy:                 0x6729b2956e8Cf3d863517E4618C3d8722548D5C4
// Implementaion:         0xA649E9B886d2A1A1713268Ef6BC05E89A22a5436

// 2024/10/16
// yarn deploy:matic_test:GreenBTC2SU:  Amoy testnet, Support multiple seed mode 
// Proxy:                 0x6729b2956e8Cf3d863517E4618C3d8722548D5C4
// Implementaion:         0x9ab6a15F421FA92eE8111cD096dc37C7859Cb4c9

func.tags = ["GreenBTC2SU"];

export default func;
