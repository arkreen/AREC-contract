import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let AKREToken_ADDRESS
    let REGISTRY_ADDRESS
    let ISSUER_ADDRESS
    
    if(hre.network.name === 'localhost') {
      AKREToken_ADDRESS = "0xa0cE9DC3d93F4c84aAACd8DA3f66Cd6dA9D5b1F8"
      REGISTRY_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
      ISSUER_ADDRESS      = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"      
    }  else if(hre.network.name === 'goerli')  {
      AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
      REGISTRY_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
      ISSUER_ADDRESS      = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"      
    }  
    else if(hre.network.name === 'matic_test')  {     // Simulation
      // AKREToken_ADDRESS   = "0x54e1c534f59343c56549c76d1bdccc8717129832"
      // REGISTRY_ADDRESS    = "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"
      // ISSUER_ADDRESS      = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"

      // 2024/04/15 Amoy Testnet
      AKREToken_ADDRESS   = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
      REGISTRY_ADDRESS    = "0x908C77c31bA81C2FC0Ec15Ce53cFd65f9c4aEECc"
      ISSUER_ADDRESS      = "0xF1CF65Dbfa9cCEe650a053E218F5788F63bDA60E"
    } 
//    else if(hre.network.name === 'matic_test')  {     // real game miner
//      AKREToken_ADDRESS   = "0x6c28fF02d3A132FE52D022db1f25a33d91caeCA2"
//      REGISTRY_ADDRESS   = "0x61a914363ef99aabca69504cee5ccfd5523c845d"
//      ISSUER_ADDRESS      = "0x0AF6Fad1e63De91d5C53Af1dD2e55BB1b278b131"
//    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test
      AKREToken_ADDRESS   = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"
//    REGISTRY_ADDRESS   = "0x3E8A27dA0BF241f588141659cBb6Bd39717527F1"       // Version Test
//    ISSUER_ADDRESS      = "0xec9254677d252df0dCaEb067dFC8b4ea5F6edAfC"      // Version Test

      REGISTRY_ADDRESS   = "0xb17faCaCA106fB3D216923DB6CaBFC7C0517029d"       // 2023/03/22: Normal release
      ISSUER_ADDRESS     = "0xec9254677d252df0dCaEb067dFC8b4ea5F6edAfC"       // 2023/03/22: same as test version

    }  else if(hre.network.name === 'celo_test')  {     // Celo test: 2023/08/21
      REGISTRY_ADDRESS    = "0x572e9B8B210414b2D76ddf578925D769D96982E6"
      ISSUER_ADDRESS      = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"

    }  else if(hre.network.name === 'celo')  {                                    // Celo: 2023/11/01
      REGISTRY_ADDRESS    = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"
      ISSUER_ADDRESS      = "0xaa65582453e121d463A51251E9d8C2BAd27ad99c"          // 2023/11/01
    } 

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    ///const ART_NAME = 'HashKey AREC Token'
    ///const SYMBOL = 'HART'

    const ART_NAME = ''         
    const SYMBOL = ''

    //const ART_NAME  = 'Classic Based AREC Token'
    //const SYMBOL    = 'CART'

    console.log("Deploying: ", CONTRACTS.RECToken, deployer);  
    const ArkreenRECToken = await deploy(CONTRACTS.RECToken, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",                   // Function to call when deployed first time.
//            args: [REGISTRY_ADDRESS, ISSUER_ADDRESS]    // 2023/2/26: Old Version

              // 2023/02/26: Name and Symbol can be customized for HashKey ESG project, test simulation
              // 2023/11/01: Celo Maninet
              // 2024/04/15: Amoy testnet, "ART"
              args: [REGISTRY_ADDRESS, ISSUER_ADDRESS, ART_NAME, SYMBOL]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenRECToken deployed to %s: ", hre.network.name, ArkreenRECToken.address);
};

// 2023/03/22
// yarn deploy:matic:RECToken
// Proxy:           0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF
// Implementation:  0xfE6B6fe2a965453c2B30f0E2159b346C61DbCA59

// 2023/08/21
// yarn deploy:celo_test:RECToken
// Proxy:           0x57Fe6324538CeDd43D78C975118Ecf8c137fC8B2
// Implementation:  0xeAe93E21ea6E3EfFB0a58d458fb8414be98e285e

// 2023/11/01
// yarn deploy:celo:RECToken
// Proxy:           0x9BBF9f544F3ceD640090f43FF6B820894f66Aaef
// Implementation:  0xC039075e8abB0821BB0e7DDF43718345900C19c8

// 2024/04/15
// yarn deploy:matic_test:RECToken (ART)
// Proxy:           0x615835Cc22064a17df5A3E8AE22F58e67bCcB778
// Implementation:  0xB0DAFF3eE3A9D17441f3E5A558786A842ece0a62

func.tags = ["RECToken"];

export default func;
