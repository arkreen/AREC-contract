import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { constants } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let AKREToken_ADDRESS
    let REGISTRY_ADDRESS
    
    if(hre.network.name === 'localhost') {
      AKREToken_ADDRESS = "0xa0cE9DC3d93F4c84aAACd8DA3f66Cd6dA9D5b1F8"
      REGISTRY_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
    }  else if(hre.network.name === 'goerli')  {
      AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
      REGISTRY_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
    }    
    else if(hre.network.name === 'matic_test')  {     // Simulation
        AKREToken_ADDRESS   = "0x54e1c534f59343c56549c76d1bdccc8717129832"
        REGISTRY_ADDRESS   = "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"
    } 
//    else if(hre.network.name === 'matic_test')  {       // real game miner
//      AKREToken_ADDRESS   = "0x6c28fF02d3A132FE52D022db1f25a33d91caeCA2"
//      REGISTRY_ADDRESS   = "0x61a914363ef99aabca69504cee5ccfd5523c845d"
//  } 
    else if(hre.network.name === 'matic')  {              // MATIC Mainnet
      AKREToken_ADDRESS   = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"
//    REGISTRY_ADDRESS    = "0x3E8A27dA0BF241f588141659cBb6Bd39717527F1"          // Version for test
      REGISTRY_ADDRESS    = "0xb17faCaCA106fB3D216923DB6CaBFC7C0517029d"          // 2023/3/23: Normal Release
    } 
    else if(hre.network.name === 'celo_test')  {      // Simulation
      AKREToken_ADDRESS   = constants.AddressZero
      REGISTRY_ADDRESS   = "0x572e9B8B210414b2D76ddf578925D769D96982E6"
      
    } if(hre.network.name === 'celo')  {              // mainnet
      AKREToken_ADDRESS   = constants.AddressZero
      REGISTRY_ADDRESS   = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"
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
              args: [AKREToken_ADDRESS, REGISTRY_ADDRESS]
            },
//            onUpgrade: {
//              methodName: "postUpdate", // method to be executed when the proxy is upgraded (not first deployment)
//              args: [],
//            },             
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenRECIssuance deployed to %s: ", hre.network.name, ArkreenRECIssuance.address);
};

// 2023/03/22
// yarn deploy:matic:RECIssue
// Proxy:           0x954585adF9425F66a0a2FD8e10682EB7c4F1f1fD
// Implementation:  0x345762D12F046F7c0EBDbBfDC1B068eEE2eF3fDC

// 2023/08/21
// yarn deploy:celo_test:RECIssue
// Proxy:           0x66e9c20DE3711e7C8c886d461aACd6E092E161BE
// Implementation:  0xc9865313b3EeB737C0061a578ca4Af722Add84CB

// 2023/10/31
// yarn deploy:celo:RECIssue
// Proxy:           0xbB4b287Fdd601662eCf17fB6EDF3943A15D1b63e
// Implementation:  0x2F4277E7Ec4FC9980Aa4F81d82E30575550099A9

func.tags = ["RECIssue"];

export default func;
