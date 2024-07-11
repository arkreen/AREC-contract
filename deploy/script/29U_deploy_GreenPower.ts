import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";
import { GreenPower__factory } from "../../typechain";
import { ethers } from "hardhat";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(160_000_000_000)

    let greenPowerAddress
    let tokenART

    let USDC_ADDRESS
    let USDT_ADDRESS
    
    if(hre.network.name === 'matic_test')  {
      // 2024/06/26: Amoy testnet                        
      greenPowerAddress                 = "0x18D14932e9444dCBc920D392cD317f5d2BB319ab"  // 06/26
      // const NEW_IMPLEMENTATION       = "0x92B3B82c322BAC3dF00F68B93C61F5B69A8dfBfa"  // 2024/07/11: Amoy testnet (Dev Anv): checkIfOffsetWon is added
      const NEW_IMPLEMENTATION          = "0xD79601e15C761AabcfDE021Bb05e411263825E29"  // 2024/07/11: Amoy testnet (Dev Anv): checkIfOffsetWon is fixed

      console.log("Updating greenPower: ", greenPowerAddress, defaultGasPrice.toString());  

      const greenPowerFactory = GreenPower__factory.connect(greenPowerAddress, deployer);
      const updateTx = await greenPowerFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("greenPower is upgraded to %s: ", hre.network.name, greenPowerFactory.address, NEW_IMPLEMENTATION);
    } else if(hre.network.name === 'matic')  {
      greenPowerAddress   = ""
      tokenART            = ""                
      USDC_ADDRESS        = ""                  
      USDT_ADDRESS        = ""                  
    } 

};

// 2024/07/11: upgrade:
// yarn deploy:matic_test:GreenPowerU: Amoy testnet (Dev Anv): checkIfOffsetWon is fixed

// 2024/07/11A: upgrade: , Amoy testnet (Dev Anv): checkIfOffsetWon is fixed
// yarn deploy:matic_test:GreenPowerU
// 0xD79601e15C761AabcfDE021Bb05e411263825E29

func.tags = ["GreenPowerU"];

export default func;
