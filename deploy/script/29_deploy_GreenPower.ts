import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { GreenPower__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

    let akre : string = ''
    let kWh : string = ''
    let manager: string = ''
    
    // function initialize(address kWh, address manager)
    if(hre.network.name === 'matic_test')  {
      // 2024/06/26: GreenPower on Amoy testnet                        
      akre = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
      kWh = "0xB932CDD3c6Ad3f39d50278A76fb952A6077d1950"
      manager = "0xEe0733Aa789F70233b3eD4F7dF95f1a7e0640D7e"
    } else if(hre.network.name === 'matic')  {
      akre = "0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3"
      kWh = "0x5740A27990d4AaA4FB83044a6C699D435B9BA6F1"
      manager = "0x3B3e675412c78C12030ff30b4dDEF48030bf927d"
    } 

    console.log("Deploying: ", "GreenPower", deployer);  
    
    const greenPower = await deploy("GreenPower", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [akre, kWh, manager]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

/*
    // 2024/07/11
    const IMPLEMENTATION_ADDRESS ="0x92B3B82c322BAC3dF00F68B93C61F5B69A8dfBfa"
        
    const callData = GreenPower__factory.createInterface().encodeFunctionData("initialize", [akre, kWh, manager])
    const greenPower = await deploy(CONTRACTS.UUPSProxy, {
            from: deployer,
            args: [IMPLEMENTATION_ADDRESS, deployer, callData],
            log: true,
            skipIfAlreadyDeployed: false,
            gasPrice: defaultGasPrice
    });
  */

    console.log("USDT deployed to %s: ", hre.network.name, greenPower.address);
};

// 2024/06/12
// yarn deploy:matic_test:GreenPower    : Amoy testnet (Dev Anv)
// Proxy:                 0x18D14932e9444dCBc920D392cD317f5d2BB319ab
// Implementaion:         0xb7709B0777c1d52Fc3a941401fa3E5b050bE16Ac

// 2024/07/14
// yarn deploy:matic:GreenPower    : Polygon mainnet
// Proxy:                 0x12202fDD4e3501081b346C81a64b06A689237a47
// Implementaion:         0x04C904B102475a4da0C2F92213d72e5795A6ed48


func.tags = ["GreenPower"];

export default func;
