import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    let REGISTRY_ADDRESS
   
    if(hre.network.name === 'localhost') {
      REGISTRY_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
    }  else if(hre.network.name === 'goerli')  {
      REGISTRY_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
    }    
//    else if(hre.network.name === 'matic_test')  {
//      REGISTRY_ADDRESS   = "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"
//    } 
    else if(hre.network.name === 'matic_test')  {
      REGISTRY_ADDRESS   = "0x61a914363ef99aabca69504cee5ccfd5523c845d"
    } 
    else if(hre.network.name === 'matic')  {                           // Matic Mainnet for test
      REGISTRY_ADDRESS   = "0x3E8A27dA0BF241f588141659cBb6Bd39717527F1"
    }     

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECBadge, deployer);  
    const ArkreenBadge = await deploy(CONTRACTS.RECBadge, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [REGISTRY_ADDRESS]
            },
            onUpgrade: {
              methodName: "postUpdate", // method to be executed when the proxy is upgraded (not first deployment)
              args: [],
            },               
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenBadge deployed to %s: ", hre.network.name, ArkreenBadge.address);
};

func.tags = ["RECBadge"];

export default func;
