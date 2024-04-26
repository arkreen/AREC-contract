import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    let tokenART
    let manager
    let from
    
    if(hre.network.name === 'matic_test')  {
      // 2024/04/26: Amoy testnet                        
      tokenART = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"
      manager = "0x8C4D62477F70C7Ea628B52dbF37DcC2E5e4043E2"
      from = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D" 
    } else if(hre.network.name === 'matic')  {
      // 2024/04/26: Polygon mainnet             
      tokenART = "0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF"
      manager = "0x1E1A152D1C77A16863e97DAf18E99f85a5F0a605"
      from = "0x1249B1eABcAE642CF3Cb1e512a0075CEe92769BE" 
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

// 2024/04/16
// yarn deploy:matic:ClaimToken    : Polygon miannet
// Proxy:                 0x62DD5611aa2708c3989DD33EBf913Eb428B28302 
// Implementaion:         0x17Eea195A8466a1f820203a35e08047C957f55ab

func.tags = ["ClaimToken"];

export default func;
