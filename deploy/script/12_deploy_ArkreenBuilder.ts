import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let ROUTER_ADDRESS
    let WMATIC_ADDRESS
    
    if(hre.network.name === 'matic_test')  {    
      ROUTER_ADDRESS   = "0x75bcdf4e9900fac6d8e601624435d9269bad9051"       // Router address
      WMATIC_ADDRESS   = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"       // WMATIC address

      // Result:  
      // 0xa05a9677a9216401cf6800d28005b227f7a3cfae                         // 2023/02/25, simulation 
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test
      ROUTER_ADDRESS   = ""
      WMATIC_ADDRESS   = ""
    } 

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.ABuilder, deployer);  
    const ArkreenBuilder = await deploy(CONTRACTS.ABuilder, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [ROUTER_ADDRESS, WMATIC_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenBuilder deployed to %s: ", hre.network.name, ArkreenBuilder.address);
};

func.tags = ["ABuilder"];

export default func;
