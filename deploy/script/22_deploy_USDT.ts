import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100000000000)

    let USDT_NAME
    let USDT_SYMBOL
    let USDT_DECIMAL
    let USDT_MANAGER
    
    if(hre.network.name === 'matic_test')  {
      // 2024/04/16: Amoy testnet                        
      USDT_NAME = 'Tether USD'
      USDT_SYMBOL  = "USDT"   
      USDT_DECIMAL = 6     
      USDT_MANAGER = deployer     
    }

    console.log("Deploying: ", "UChildERC20", deployer);  
    const USDT = await deploy("UChildERC20", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [USDT_NAME, USDT_SYMBOL, USDT_DECIMAL, USDT_MANAGER]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    console.log("USDT deployed to %s: ", hre.network.name, USDT.address);
};

// 2024/04/16
// yarn deploy:matic_test:USDT    : Amoy testnet (Dev Anv)
// Proxy:                 0xc7767ae828E4830e2f800981E573f333d1E492b5 
// Implementaion:         0x17098DA15e84F29a17622F423B482dE1C0B77F42

func.tags = ["USDT"];

export default func;
