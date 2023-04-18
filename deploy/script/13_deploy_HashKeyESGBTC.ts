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
      BUILDER_ADDRESS   = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"
      HART_ADDRESS      = "0x93b3bb6C51A247a27253c33F0d0C2FF1d4343214"
      NATIVE_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
      NUM_CELL          = 2427
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

// 2023/03/14
// deploy:matic_test:HskBTC
// Proxy:         0x785dca2ca9a51513da1fef9f70e6b6ab02896f67
// Implementaion: 0x16f40bf24e7232056800b0601d6f36121f66ff44

// 2023/04/05
// deploy:matic:HskBTC    : Normal Release
// Proxy:         0xfe9341218c7Fcb6DA1eC131a72f914B7C724F200         
// Implementaion: 0xf4425F9596F8015cf95cb0d3DFDB5316F5EC6069

func.tags = ["HskBTC"];

export default func;
