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
    let bankContractAddress

    let USDC_ADDRESS
    let USDT_ADDRESS
    
    if(hre.network.name === 'matic_test')  {
      // 2024/06/26: Amoy testnet                        
      greenPowerAddress   = "0x18D14932e9444dCBc920D392cD317f5d2BB319ab"              // 06/26

      tokenART          = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"                // Amoy testnet
      USDC_ADDRESS      = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"                // USDC address
      USDT_ADDRESS      = "0xc7767ae828E4830e2f800981E573f333d1E492b5"                // USDT address

      bankContractAddress = "0xf9aAcFf1B292F82b60662e47610C570ef58d3c70"

      const greenPower = GreenPower__factory.connect(greenPowerAddress, deployer);
    
      // 2024/06/26: Amoy testnet                        
      // await greenPower.approveConvertkWh( [tokenART, USDC_ADDRESS, USDT_ADDRESS], {gasPrice: defaultGasPrice})

      // 2024/08/12: Amoy testnet 
      //await greenPower.setBankAndART(bankContractAddress, tokenART, {gasPrice: defaultGasPrice})

      // 2024/09/2: Amoy testnet
      await greenPower.approveBank([USDC_ADDRESS, USDT_ADDRESS], {gasPrice: defaultGasPrice})

      console.log("approve ConvertkWh", greenPower.address)
      
    } else if(hre.network.name === 'matic')  {
      greenPowerAddress   = "0x12202fDD4e3501081b346C81a64b06A689237a47"
      bankContractAddress = "0xab65900A52f1DcB722CaB2e5342bB6b128630A28"
      tokenART            = "0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF"            // Polygon testnet
      USDC_ADDRESS        = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"            // USDC address
      USDT_ADDRESS        = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"            // USDT address

      const greenPower = GreenPower__factory.connect(greenPowerAddress, deployer);
    
      // 2024/07/14: Polygon mainnet
      //await greenPower.approveConvertkWh( [tokenART, USDC_ADDRESS, USDT_ADDRESS], {gasPrice: defaultGasPrice})

      // 2024/08/11: Polygon mainnet
      // await greenPower.setBankAndART(bankContractAddress, tokenART, {gasPrice: defaultGasPrice})

      // 2024/09/2: Polygon mainnet
      await greenPower.approveBank([USDC_ADDRESS, USDT_ADDRESS], {gasPrice: defaultGasPrice})

      console.log("approve ConvertkWh", greenPower.address)
    } 

};

// 2024/06/26: Call approveConvertkWh
// yarn deploy:matic_test:GreenPowerI     : Amoy testnet (Dev Anv)

// 2024/07/14: Call approveConvertkWh
// yarn deploy:matic:GreenPowerI          : Polygon mainnet

// 2024/08/11: Call setBankAndART
// yarn deploy:matic:GreenPowerI          : Polygon mainnet

// 2024/08/12: Call setBankAndART
// yarn deploy:matic_test:GreenPowerI     : Amoy testnet (Dev Anv)

// 2024/09/02: Call approveBank
// yarn deploy:matic:GreenPowerI          : Polygon mainnet

// 2024/09/02: Call approveBank
// yarn deploy:matic_test:GreenPowerI      : Amoy testnet (Dev Anv)

func.tags = ["GreenPowerI"];

export default func;
