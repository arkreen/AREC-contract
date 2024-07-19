import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { GreenBTC2S__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

    let kWh : string = ''
    
    // function initialize(address kWh)
    if(hre.network.name === 'matic_test')  {
      // 2024/07/05: GreenBTCV2S on Amoy testnet                        
      kWh = "0xB932CDD3c6Ad3f39d50278A76fb952A6077d1950"
    } else if(hre.network.name === 'matic')  {
      kWh = ""
    } 

    console.log("Deploying: ", "GreenBTC2S", deployer);  
    
    const GreenBTC2S = await deploy("GreenBTC2S", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [kWh, deployer]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    /*
    // 2024/06/15
    const IMPLEMENTATION_ADDRESS ="0x2A1a657335d46226f7296e03444C2fACeF10F535"
        
    const callData = GreenBTC2S__factory.createInterface().encodeFunctionData("initialize", [kWh])
    const GreenBTC2S = await deploy(CONTRACTS.UUPSProxy, {
            from: deployer,
            args: [IMPLEMENTATION_ADDRESS, deployer, callData],
            log: true,
            skipIfAlreadyDeployed: false,
            gasPrice: defaultGasPrice
    });
    */

    console.log("GreenBTC2S deployed to %s: ", hre.network.name, GreenBTC2S.address);
};


// 2024/07/05
// yarn deploy:matic_test:GreenBTC2S    : Amoy testnet (Dev Anv): Remove the open/claim logic
// Proxy:                 0xf276AD41bA60e723188496318Ba0E41733C9fF3F
// Implementaion:         0x51016EafbC75058391beEea156Ab6B8Ad9B92E52

// 2024/07/18
// yarn deploy:matic_test:GreenBTC2S    : Amoy testnet (Dev Anv): Change the lucky ratio handling
// Proxy:                 0x6729b2956e8Cf3d863517E4618C3d8722548D5C4
// Implementaion:         0x32Dbe18BBc2C752203b6e1bE87EdE5655A091dFa

func.tags = ["GreenBTC2S"];

export default func;
