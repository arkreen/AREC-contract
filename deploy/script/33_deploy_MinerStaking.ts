import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { MinerStaking__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

    let stakingToken : string = ''
    let manager: string = ''
    let reward: string = ''
    
    // function initialize(address kWh, address manager)
    if(hre.network.name === 'matic_test')  {
      // 2024/08/6: PlugMinerSales on Amoy testnet                        
      stakingToken = "0x0ae690aad8663aab12a671a6a0d74242332de85f"
      manager = "0xEe0733Aa789F70233b3eD4F7dF95f1a7e0640D7e"
      reward = "0x78F018BF6af8C9A366735CFf0689486A0855bF89"
    } else if(hre.network.name === 'matic')  {
      stakingToken = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
      manager = "0x3B3e675412c78C12030ff30b4dDEF48030bf927d"
      reward = "0xDcF10d429c0422Af80790bC810A33189771D643d"
    } 

    console.log("Deploying: ", "PlugMinerSales", deployer);  
    
    const minerStaking = await deploy("MinerStaking", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [stakingToken, manager, reward]
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
        
    const callData = MinerStaking__factory.createInterface().encodeFunctionData("initialize", [native, manager, receiver])
    const plugMinerSales = await deploy(CONTRACTS.UUPSProxy, {
            from: deployer,
            args: [IMPLEMENTATION_ADDRESS, deployer, callData],
            log: true,
            skipIfAlreadyDeployed: false,
            gasPrice: defaultGasPrice
    });
  */

    console.log("MinerStaking deployed to %s: ", hre.network.name, minerStaking.address);
};

// 2024/10/16
// yarn deploy:matic_test:MinerStaking    : Amoy testnet (Dev Anv)
// Proxy:                 0x8FCa4A8fB8a14Fb1F4BC64F48f36c528Dd724C13
// Implementaion:         0x6197F15D9603C09cD401F9461Fc7d38302058Ce9

func.tags = ["MinerStaking"];

export default func;
