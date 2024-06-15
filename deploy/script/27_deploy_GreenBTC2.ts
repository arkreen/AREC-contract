import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { GreenBTC2__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    let kWh : string = ''
    let claimManager: string = ''
    
    // function initialize(address kWh, address manager)
    if(hre.network.name === 'matic_test')  {
      // 2024/06/12: GreenBTCV2 on Amoy testnet                        
      kWh = "0xB932CDD3c6Ad3f39d50278A76fb952A6077d1950"
      claimManager = "0x364a71ee7a1c9eb295a4f4850971a1861e9d3c7d"
    } else if(hre.network.name === 'matic')  {
      kWh = ""
      claimManager = ""
    } 

    console.log("Deploying: ", "GreenBTC2", deployer);  
    
    /*
    const greenBTC2 = await deploy("GreenBTC2", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [kWh, claimManager]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
    */

    
    // 2024/06/15
    const IMPLEMENTATION_ADDRESS ="0xA7b01a0670FE0224bE3265F97823dF4D71764d06"
    
    const callData = GreenBTC2__factory.createInterface().encodeFunctionData("initialize", [kWh, claimManager])
    const greenBTC2 = await deploy(CONTRACTS.UUPSProxy, {
            from: deployer,
            args: [IMPLEMENTATION_ADDRESS, deployer, callData],
            log: true,
            skipIfAlreadyDeployed: false,
            gasPrice: defaultGasPrice
    });
  
    console.log("USDT deployed to %s: ", hre.network.name, greenBTC2.address);
};

// 2024/06/12
// yarn deploy:matic_test:GreenBTC2    : Amoy testnet (Dev Anv)
// Proxy:                 0x20E45e53B813788C2D169D3D861A4C0Ae3bDD4eA
// Implementaion:         0xf05CDd31b95C80D4DA67DFf799F866938A54A2E8

// 2024/06/15
// yarn deploy:matic_test:GreenBTC2    : Amoy testnet (Dev Anv): Remove data copy from GreenBTC 
// Proxy:                 0x7670fE3CD59a43082214d070150Fa31D2054cB7a (UUPS)
// Implementaion:         0xA7b01a0670FE0224bE3265F97823dF4D71764d06

func.tags = ["GreenBTC2"];

export default func;
