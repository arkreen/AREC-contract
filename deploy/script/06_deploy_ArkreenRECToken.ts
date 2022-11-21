import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let AKREToken_ADDRESS
    let REGISTERY_ADDRESS
    let ISSUER_ADDRESS
    
    if(hre.network.name === 'localhost') {
      AKREToken_ADDRESS = "0xa0cE9DC3d93F4c84aAACd8DA3f66Cd6dA9D5b1F8"
      REGISTERY_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
      ISSUER_ADDRESS      = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"      
    }  else if(hre.network.name === 'goerli')  {
      AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
      REGISTERY_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
      ISSUER_ADDRESS      = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"      
    }    
//    else if(hre.network.name === 'matic_test')  {     // Simulation
//      AKREToken_ADDRESS   = "0x54e1c534f59343c56549c76d1bdccc8717129832"
//      REGISTERY_ADDRESS   = "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"
//      ISSUER_ADDRESS      = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"
//    } 
    else if(hre.network.name === 'matic_test')  {     // real game miner
      AKREToken_ADDRESS   = "0x6c28fF02d3A132FE52D022db1f25a33d91caeCA2"
      REGISTERY_ADDRESS   = "0x61a914363ef99aabca69504cee5ccfd5523c845d"
      ISSUER_ADDRESS      = "0x0AF6Fad1e63De91d5C53Af1dD2e55BB1b278b131"
    } 


    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECToken, deployer);  
    const ArkreenRECToken = await deploy(CONTRACTS.RECToken, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [REGISTERY_ADDRESS, ISSUER_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenRECToken deployed to %s: ", hre.network.name, ArkreenRECToken.address);
};

func.tags = ["RECToken"];

export default func;
