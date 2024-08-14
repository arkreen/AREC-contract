import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";
import { GreenPower__factory } from "../../typechain";
import { ethers } from "hardhat";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

    let greenPowerAddress
    let tokenART

    let USDC_ADDRESS
    let USDT_ADDRESS
    
    if(hre.network.name === 'matic_test')  {
      // 2024/06/26: Amoy testnet                        
      greenPowerAddress                 = "0x18D14932e9444dCBc920D392cD317f5d2BB319ab"  // 06/26
      // const NEW_IMPLEMENTATION       = "0x92B3B82c322BAC3dF00F68B93C61F5B69A8dfBfa"  // 2024/07/11: Amoy testnet (Dev Anv): checkIfOffsetWon is added
      // const NEW_IMPLEMENTATION       = "0xD79601e15C761AabcfDE021Bb05e411263825E29"  // 2024/07/11: Amoy testnet (Dev Anv): checkIfOffsetWon is fixed
      // const NEW_IMPLEMENTATION       = "0xc7A014f4b823788812A9Cd08D1c819e882b13b89"  // 2024/07/12: Amoy testnet (Dev Anv): checkIfOffsetWon is changed of the return data format
      // const NEW_IMPLEMENTATION       = "0xb60adb684A682835819a8b4Be2dB6163dEaB393C"  // 2024/07/12: Amoy testnet (Dev Anv): checkIfOffsetWon is removed index limitation
      // const NEW_IMPLEMENTATION       = "0x0b647B26264F9e11F9f3186A6ef0c296205Aa452"  // 2024/08/12: Amoy testnet (Dev Anv): offsetPowerAgent/deposit/withdraw are added
      const NEW_IMPLEMENTATION          = "0x1664A0dD344c00df424fe42382222948B6f0b27d"  // 2024/08/14: Amoy testnet (Dev Anv): change AutoOffsetChanged event

      console.log("Updating greenPower: ", greenPowerAddress, defaultGasPrice.toString());  

      const greenPowerFactory = GreenPower__factory.connect(greenPowerAddress, deployer);
      const updateTx = await greenPowerFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("greenPower is upgraded to %s: ", hre.network.name, greenPowerFactory.address, NEW_IMPLEMENTATION);
    } else if(hre.network.name === 'matic')  {
      // 2024/08/11: Polygon mainnet
      greenPowerAddress                 = "0x12202fDD4e3501081b346C81a64b06A689237a47"  // 08/11
      // const NEW_IMPLEMENTATION       = "0x325218927993688a3A423A97Dc2808C09C0D658F"  // 2024/08/11: offsetPowerAgent/deposit/withdraw are added
      // const NEW_IMPLEMENTATION       = "0x5EaEa14E04e6AAB4Ee590B2808d0DaFECf8317A5"  // 2024/08/12: Change Effective date
      const NEW_IMPLEMENTATION          = "0xF935F32058B3d38794C72ac31c117CF9E126e096"  // 2024/08/14: change AutoOffsetChanged event

      console.log("Updating greenPower: ", greenPowerAddress, defaultGasPrice.toString());  

      const greenPowerFactory = GreenPower__factory.connect(greenPowerAddress, deployer);
      const updateTx = await greenPowerFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("greenPower is upgraded to %s: ", hre.network.name, greenPowerFactory.address, NEW_IMPLEMENTATION);
    } 

};

// 2024/07/11: upgrade:
// yarn deploy:matic_test:GreenPowerU: Amoy testnet (Dev Anv): checkIfOffsetWon is fixed

// 2024/07/11A: upgrade: , Amoy testnet (Dev Anv): checkIfOffsetWon is fixed
// yarn deploy:matic_test:GreenPowerU
// 0xD79601e15C761AabcfDE021Bb05e411263825E29

// 2024/07/12: upgrade: , Amoy testnet (Dev Anv): checkIfOffsetWon is changed of the return data format
// and checkIfOffsetWonBytes is added.
// yarn deploy:matic_test:GreenPowerU
// 0xc7A014f4b823788812A9Cd08D1c819e882b13b89

// 2024/07/12A: upgrade: , Amoy testnet (Dev Anv): checkIfOffsetWon is removed index limitation
// yarn deploy:matic_test:GreenPowerU
// 0xb60adb684A682835819a8b4Be2dB6163dEaB393C

// 2024/08/11: upgrade:  Polygon mainnet: offsetPowerAgent/deposit/withdraw are added
// yarn deploy:matic:GreenPowerU
// 0x325218927993688a3A423A97Dc2808C09C0D658F

// 2024/08/12: upgrade:  Amoy testnet: offsetPowerAgent/deposit/withdraw are added
// yarn deploy:matic_test:GreenPowerU
// 0x0b647B26264F9e11F9f3186A6ef0c296205Aa452

// 2024/08/12: upgrade:  Polygon mainnet: change effective date
// yarn deploy:matic:GreenPowerU
// 0x5EaEa14E04e6AAB4Ee590B2808d0DaFECf8317A5

// 2024/08/14: upgrade:  Amoy testnet: change AutoOffsetChanged event
// yarn deploy:matic_test:GreenPowerU
// 0x1664A0dD344c00df424fe42382222948B6f0b27d

// 2024/08/12: upgrade:  Polygon mainnet: change AutoOffsetChanged event
// yarn deploy:matic:GreenPowerU
// 0xF935F32058B3d38794C72ac31c117CF9E126e096

func.tags = ["GreenPowerU"];

export default func;
