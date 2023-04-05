import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let ROUTER_ADDRESS
    let WMATIC_ADDRESS
    let RECBANK_ADDRESS
    
    if(hre.network.name === 'matic_test')  {    
      ROUTER_ADDRESS   = "0x75bcdf4e9900fac6d8e601624435d9269bad9051"       // Router address
      WMATIC_ADDRESS   = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"       // WMATIC address

      // Result:  
      // 0xa05a9677a9216401cf6800d28005b227f7a3cfae                         // 2023/02/25, simulation 
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test
      ROUTER_ADDRESS    = "0x938b544ce2ae40b6de0ab728a69c37a60159689a"
      RECBANK_ADDRESS   = "0xab65900A52f1DcB722CaB2e5342bB6b128630A28"
      WMATIC_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
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
              args: [ROUTER_ADDRESS, RECBANK_ADDRESS, WMATIC_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("ArkreenBuilder deployed to %s: ", hre.network.name, ArkreenBuilder.address);
};

// 2023/04/05
// yarn deploy:matic:ABuilder
// Proxy:           0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e
// Implementation:  0x56a2005361d5f0f1f5AD6C3Cd050f7F152457a3f

func.tags = ["ABuilder"];

export default func;
