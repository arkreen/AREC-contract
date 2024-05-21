import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    let tokenAKRE
    let tokenART
    let minerContract    
    let rewardsDistributor
    let from
    
    if(hre.network.name === 'matic_test')  {
      // 2024/05/16: AKRE on Amoy testnet                        
      tokenAKRE = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
      tokenART = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"
      minerContract = "0xF390caaF4FF0d297e0b4C3c1527D707C75541736"
      rewardsDistributor = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"
    } else if(hre.network.name === 'matic')  {
      tokenAKRE = ""
      tokenART = ""
      minerContract = ""
      rewardsDistributor = ""
      from = "" 
    } 

    console.log("Deploying: ", "StakingRewards", deployer);  
    const claimToken = await deploy("StakingRewards", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [tokenAKRE, tokenART, minerContract, rewardsDistributor]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    console.log("USDT deployed to %s: ", hre.network.name, claimToken.address);
};

// 2024/05/16
// yarn deploy:matic_test:StakingRewards    : Amoy testnet (Dev Anv)
// Proxy:                 0x691938a6e88a85E66Aab05ECf84Fe84ECE8351C9
// Implementaion:         0x529D9956844af588b6B6Bc8eA6c8F80CaF5ac7B9

func.tags = ["StakingRewards"];

export default func;