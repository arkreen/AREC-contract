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
    let rewarder    
    let manager
    let from
    
    if(hre.network.name === 'matic_test')  {
      // 2024/05/16: AKRE on Amoy testnet                        
      tokenAKRE = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
      rewarder = "0x0Bb830D12cC081F211479FFfc6B94239Df708971"
      manager = "0x167d655B9F3fB17d08C5aE05860e6262bBb98e9b"
    } else if(hre.network.name === 'matic')  {
      tokenAKRE = ""
      manager = ""
      from = "" 
    } 

    console.log("Deploying: ", "PlantStaking", deployer);  
    const claimToken = await deploy("PlantStaking", {
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

    console.log("USDT deployed to %s: ", hre.network.name, claimToken.address);
};

// 2024/05/16
// yarn deploy:matic_test:PlantStaking    : Amoy testnet (Dev Anv)
// Proxy:                 0x95f8e80e11593DAE019EBa1BF81a8b38e3294325
// Implementaion:         0xf8bd14e5af9177ffdb9fe903a76b684986d7fb45

func.tags = ["PlantStaking"];

export default func;
