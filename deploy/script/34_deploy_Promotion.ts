import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { ArkreenPromotion__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

    let stakingPool : string = ''
    let akreToken: string = ''
    let artToken: string = ''
    let minerContract: string = ''

    // function initialize(address kWh, address manager)
    if(hre.network.name === 'matic_test')  {
      // 2024/12/16: ArkreenPromotion on Amoy testnet                        
      stakingPool = "0xa2c7FD9d6F9fCD50000DAaC552d931E0185D3Be6"
      akreToken = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
      artToken = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"
      minerContract = "0xF390caaF4FF0d297e0b4C3c1527D707C75541736"
    } else if(hre.network.name === 'matic')  {
      stakingPool = "0xDfD05Fcd3d330E17151F362AB551D89CAEb40916"
      akreToken = "0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3"
      artToken = "0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF"
      minerContract = "	0xbf8eF5D950F78eF8edBB8674a48cDACa675831Ae"
    } 

    console.log("Deploying: ", "ArkreenPromotion", deployer);  
    
    const arkreenPromotion = await deploy("ArkreenPromotion", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [stakingPool, akreToken, artToken, minerContract]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

/*
    // 2024/12/16
    const IMPLEMENTATION_ADDRESS ="0x92B3B82c322BAC3dF00F68B93C61F5B69A8dfBfa"
        
    const callData = ArkreenPromotion__factory.createInterface().encodeFunctionData("initialize", [stakingPool, akreToken, artToken, minerContract])
    const arkreenPromotion = await deploy(CONTRACTS.UUPSProxy, {
            from: deployer,
            args: [IMPLEMENTATION_ADDRESS, deployer, callData],
            log: true,
            skipIfAlreadyDeployed: false,
            gasPrice: defaultGasPrice
    });
  */

    console.log("arkreenPromotion deployed to %s: ", hre.network.name, arkreenPromotion.address);
};

// 2024/12/16
// yarn deploy:matic_test:ArkreenPromotion    : Amoy testnet (Dev Anv)
// Proxy:                 0x2C870f4e1B716788bB7e75Ae990583A801564dF0
// Implementaion:         0x9031550a0aE38337a19E4eFA372B3e6b0FE94D3f

func.tags = ["ArkreenPromotion"];

export default func;
