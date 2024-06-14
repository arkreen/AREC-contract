import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";

import { BigNumber } from "ethers";

import { PlantStaking__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(60_000_000_000)

    let tokenAKRE = ''
    let rewarder  = ''   
    let manager   = ''
    
    if(hre.network.name === 'matic_test')  {
      // 2024/05/16: Plant staking on Amoy testnet                        
      tokenAKRE = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
      rewarder = "0x0Bb830D12cC081F211479FFfc6B94239Df708971"
      manager = "0x167d655B9F3fB17d08C5aE05860e6262bBb98e9b"
    } else if(hre.network.name === 'matic')  {
      // 2024/05/23, 2024/06/13: Plant staking on Polygon mainnet
      tokenAKRE = "0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3"
      rewarder = "0xDcF10d429c0422Af80790bC810A33189771D643d"
      manager = "0x9f655898f160299E4Acdcf92E04816bB7250fd81" 
    } 
    
    console.log("Deploying: ", "PlantStaking", deployer);  
    const plantStaking = await deploy("PlantStaking", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [tokenAKRE, rewarder, manager]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });


/*    
    // 2024/05/23
    // const IMPLEMENTATION_ADDRESS ="0xD2c96ACD402e913B5aD2d2C3bCb557d384b5c551"   // Polygon mainnet

    // 2024/06/04
    const IMPLEMENTATION_ADDRESS ="0x444a7eec4b796372102b905d9ecab5a2080dc65b"
    
    const callData = PlantStaking__factory.createInterface().encodeFunctionData("initialize", [tokenAKRE, rewarder, manager])
    const plantStaking = await deploy(CONTRACTS.UUPSProxy, {
        from: deployer,
        args: [IMPLEMENTATION_ADDRESS, deployer, callData],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
*/   
  
    console.log("PlantStaking deployed to %s: ", hre.network.name, plantStaking.address);
};

// 2024/05/16
// yarn deploy:matic_test:PlantStaking    : Amoy testnet (Dev Anv)
// Proxy:                 0x95f8e80e11593DAE019EBa1BF81a8b38e3294325
// Implementaion:         0xf8bd14e5af9177ffdb9fe903a76b684986d7fb45

// 2024/05/23
// yarn deploy:matic:PlantStaking    : Polygon mainnet
// Proxy:                 0xD16457cD8b1a0ac6f7F3dFFdaA610B038Cf91579 （UUPS）
// Implementaion:         0xD2c96ACD402e913B5aD2d2C3bCb557d384b5c551 

// 2024/06/4
// yarn deploy:matic_test:PlantStaking    : Amoy testnet (Dev Anv), add miner statistics
// Proxy:                 0xc585886B2A3E8a177351cB47754c7295C3C49922
// Implementaion:         0x444a7eec4b796372102b905d9ecab5a2080dc65b

// 2024/06/13
// yarn deploy:matic:PlantStaking    : Polygon mainnet
// Proxy:                  （UUPS）
// Implementaion:          

func.tags = ["PlantStaking"];

export default func;
