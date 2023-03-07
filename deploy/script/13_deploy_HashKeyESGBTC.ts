import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let BUILDER_ADDRESS
    let HART_ADDRESS
    let NATIVE_ADDRESS
    let NUM_CELL
    
    if(hre.network.name === 'matic_test')  {                                  // Simulation
      BUILDER_ADDRESS   = "0xa05a9677a9216401cf6800d28005b227f7a3cfae"        // ArkreenBuilder address
      HART_ADDRESS      = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"        // HashKey ART token address
      NATIVE_ADDRESS    = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address
      NUM_CELL          = 1980
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test
      BUILDER_ADDRESS   = ""
      HART_ADDRESS   = ""
      NATIVE_ADDRESS = ""
      NUM_CELL = 0
    } 

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.HskBTC, deployer);  
    const HashKeyESGBTC = await deploy(CONTRACTS.HskBTC, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [BUILDER_ADDRESS, HART_ADDRESS, NATIVE_ADDRESS, NUM_CELL]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("HashKeyESGBTC deployed to %s: ", hre.network.name, HashKeyESGBTC.address);
};

// 2023/02/26
// deploy:matic_test:HskBTC
// 0xDe8e59dAB27EB97b2267d4230f8FE713A637e03c


func.tags = ["HskBTC"];

export default func;
