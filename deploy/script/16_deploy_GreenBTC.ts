import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let AUTHORIZER_ADDRESS
    let BUILDER_ADDRESS
    let CART_ADDRESS
    let WMATIC_ADDRESS
    
    if(hre.network.name === 'matic_test')  {                                  // Simulation
      AUTHORIZER_ADDRESS  = "0x2df522C2bF3E570caA22FBBd06d1A120B4Dc29a8"      // Authorizeried address
      BUILDER_ADDRESS   = "0xa05a9677a9216401cf6800d28005b227f7a3cfae"        // ArkreenBuilder address
      CART_ADDRESS      = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"        // HashKey ART token address
      WMATIC_ADDRESS    = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"          // WMATIC address      
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test
      AUTHORIZER_ADDRESS  = "0x2df522C2bF3E570caA22FBBd06d1A120B4Dc29a8"      // Authorizeried address
      BUILDER_ADDRESS     = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"
      CART_ADDRESS        = "0x93b3bb6C51A247a27253c33F0d0C2FF1d4343214"
      WMATIC_ADDRESS      = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"        // WMATIC address         
    } 

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.GreenBTC, deployer);  
    const GreenBTC = await deploy(CONTRACTS.GreenBTC, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [AUTHORIZER_ADDRESS, BUILDER_ADDRESS, CART_ADDRESS, WMATIC_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("Green BTC deployed to %s: ", hre.network.name, GreenBTC.address);
};


// 2023/10/20
// deploy:matic_test:GreenBTCD    : Matic testnet
// Proxy:         0x26fa0cc54eC938DB5919b0ABc8353016f3BD81b1         
// Implementaion: 0xd915BAaC892Ed6FAE994dDcBF940574eECdbdD1f

// 2023/10/23
// yarn deploy:matic_test:GreenBTCD    : Re-deploy on Matic testnet, as much code adjustment
// Proxy:         0x8cc0b065318acf3ac761fe5a19caf68074034006         
// Implementaion: 0x6240d9780Ac11ccE9A9C269Eb68dFB1eA39eAa05

func.tags = ["GreenBTCD"];

export default func;
