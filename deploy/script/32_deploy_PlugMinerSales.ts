import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { PlugMinerSales__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

    let native : string = ''
    let manager: string = ''
    let receiver: string = ''
    
    // function initialize(address kWh, address manager)
    if(hre.network.name === 'matic_test')  {
      // 2024/08/6: PlugMinerSales on Amoy testnet                        
      native = "0x0ae690aad8663aab12a671a6a0d74242332de85f"
      manager = "0xEe0733Aa789F70233b3eD4F7dF95f1a7e0640D7e"
      receiver = deployer
    } else if(hre.network.name === 'matic')  {
      native = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
      manager = "0x3B3e675412c78C12030ff30b4dDEF48030bf927d"
      receiver = deployer
    } 

    console.log("Deploying: ", "PlugMinerSales", deployer);  
    
    const plugMinerSales = await deploy("PlugMinerSales", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [native, manager, receiver]
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
        
    const callData = PlugMinerSales__factory.createInterface().encodeFunctionData("initialize", [native, manager, receiver])
    const plugMinerSales = await deploy(CONTRACTS.UUPSProxy, {
            from: deployer,
            args: [IMPLEMENTATION_ADDRESS, deployer, callData],
            log: true,
            skipIfAlreadyDeployed: false,
            gasPrice: defaultGasPrice
    });
  */

    console.log("plugMinerSales deployed to %s: ", hre.network.name, plugMinerSales.address);
};

// 2024/06/12
// yarn deploy:matic_test:PlugMinerSales    : Amoy testnet (Dev Anv)
// Proxy:                 0x1C326496695cFE4Dde70dd188F87Dc6c069778Af
// Implementaion:         0x25253a36CE26F004Ba941A1e12aa0c33D0574Ff4

func.tags = ["PlugMinerSales"];

export default func;
