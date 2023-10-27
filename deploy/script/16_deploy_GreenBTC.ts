import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let AUTHORIZER_ADDRESS
    let BUILDER_ADDRESS
    let CART_ADDRESS
    let WMATIC_ADDRESS
    
    if(hre.network.name === 'matic_test')  {                                  // Simulation
      AUTHORIZER_ADDRESS  = "0x2df522C2bF3E570caA22FBBd06d1A120B4Dc29a8"      // Authorizeried address
      BUILDER_ADDRESS   = "0xa05a9677a9216401cf6800d28005b227f7a3cfae"        // ArkreenBuilder address
      CART_ADDRESS      = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"        // HashKey ART token address
      WMATIC_ADDRESS    = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address      
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test
      AUTHORIZER_ADDRESS  = "0x0dE4fB23694c1532815Ad90fd1689c7234242FE3"      // Authorizeried address
      BUILDER_ADDRESS     = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"
      CART_ADDRESS        = "0x0D7899F2D36344ed21829D4EBC49CC0d335B4A06"
      WMATIC_ADDRESS      = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"        // WMATIC address         
    } 

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6000000000) : BigNumber.from(100000000000)

    console.log("Deploying: ", CONTRACTS.GreenBTC, deployer);  
    const GreenBTC = await deploy(CONTRACTS.GreenBTC, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [AUTHORIZER_ADDRESS, BUILDER_ADDRESS, CART_ADDRESS, WMATIC_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    console.log("Green BTC deployed to %s: ", hre.network.name, GreenBTC.address);
};


// 2023/10/20
// deploy:matic_test:GreenBTC    : Matic testnet
// Proxy:         0x26fa0cc54eC938DB5919b0ABc8353016f3BD81b1         
// Implementaion: 0xd915BAaC892Ed6FAE994dDcBF940574eECdbdD1f

// 2023/10/23
// yarn deploy:matic_test:GreenBTC    : Re-deploy on Matic testnet, as much code adjustment
// Proxy:         0x8cc0b065318acf3ac761fe5a19caf68074034006         
// Implementaion: 0x6240d9780Ac11ccE9A9C269Eb68dFB1eA39eAa05

// 2023/10/24
// yarn deploy:matic_test:GreenBTC    : Re-deploy on Matic testnet, as changed to be kind of ERC721EnumerableUpgradeable
// Proxy:         0x770cb90378cb59665bbf623a72b90f427701c825         
// Implementaion: 0x8ca0016B53D16E1712145937C36f009C4f7d493B

// 2023/10/27
// yarn deploy:matic:GreenBTC    
// Proxy:         0x32C4c4953c03Fa466424A9ee11BE9863EBfc55aC          
// Implementaion: 0xa39e0f0d688d0f3E3F6D41dd0B46b46aFcC13235

// 2023/10/27: 1: Moving all svg logic to image contract
// yarn deploy:matic:GreenBTC    
// Proxy:         0xDf51F3DCD849f116948A5B23760B1ca0B5425BdE   (Manually)  
// Implementaion: 0x85304b15f0762c0b2752C60e29D04843b17D79c7

func.tags = ["GreenBTC"];

export default func;
