import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100_000_000_000)

    let tokenART
    let manager
    let from
    
    if(hre.network.name === 'matic_test')  {
      // 2024/04/26: Amoy testnet                        
      tokenART = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"
      manager = "0x8C4D62477F70C7Ea628B52dbF37DcC2E5e4043E2"
      from = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D" 
    }

    console.log("Deploying: ", "ClaimToken", deployer);  
    const claimToken = await deploy("ClaimToken", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [tokenART, manager, from]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    console.log("USDT deployed to %s: ", hre.network.name, claimToken.address);
};

// 2024/04/16
// yarn deploy:matic_test:ClaimToken    : Amoy testnet (Dev Anv)
// Proxy:                 0x280a7c4E032584F97E84eDd396a00799da8D061A 
// Implementaion:         0x6cc9F08e0516f684E235e2F2Af896ca56141d930

func.tags = ["ClaimToken"];

export default func;
