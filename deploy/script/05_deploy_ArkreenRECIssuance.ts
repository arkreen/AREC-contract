import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let AKREToken_ADDRESS
    let REGISTERY_ADDRESS
    
    if(hre.network.name === 'localhost') {
      AKREToken_ADDRESS = "0xa0cE9DC3d93F4c84aAACd8DA3f66Cd6dA9D5b1F8"
      REGISTERY_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
    }  else if(hre.network.name === 'goerli')  {
      AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
      REGISTERY_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
    }    
    else if(hre.network.name === 'matic_test')  {
        AKREToken_ADDRESS   = "0x54e1c534f59343c56549c76d1bdccc8717129832"
        REGISTERY_ADDRESS   = "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"
    } 

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECIssuance, deployer);  
    const ArkreenRECIssuance = await deploy(CONTRACTS.RECIssuance, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [AKREToken_ADDRESS, REGISTERY_ADDRESS]
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

    console.log("ArkreenRECIssuance deployed to %s: ", hre.network.name, ArkreenRECIssuance.address);
};

func.tags = ["RECIssue"];

export default func;
