import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    let REGISTERY_ADDRESS
   
    if(hre.network.name === 'localhost') {
      REGISTERY_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
    }  else if(hre.network.name === 'goerli')  {
      REGISTERY_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
    }    
    else if(hre.network.name === 'matic_test')  {
      REGISTERY_ADDRESS   = "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"
    } 

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECRetire, deployer);  
    const ArkreenRetirement = await deploy(CONTRACTS.RECRetire, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [REGISTERY_ADDRESS]
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

    console.log("ArkreenRetirement deployed to %s: ", hre.network.name, ArkreenRetirement.address);
};

func.tags = ["RECRetire"];

export default func;
