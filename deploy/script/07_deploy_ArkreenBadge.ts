import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    let REGISTRY_ADDRESS

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6_000_000_000) : BigNumber.from(100_000_000_000)
   
    if(hre.network.name === 'localhost') {
      REGISTRY_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
    }  else if(hre.network.name === 'goerli')  {
      REGISTRY_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
    }    
//    else if(hre.network.name === 'matic_test')  {
//      REGISTRY_ADDRESS   = "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"
//    } 
    else if(hre.network.name === 'matic_test')  {
//    REGISTRY_ADDRESS   = "0x61a914363ef99aabca69504cee5ccfd5523c845d"
//    REGISTRY_ADDRESS   = "0xfEcbD33525d9B869e5f3CaB895cd6D7A666209ee"   // ArkreenRegistry for dev environment
      REGISTRY_ADDRESS   = "0x908C77c31bA81C2FC0Ec15Ce53cFd65f9c4aEECc"   // ArkreenRegistry Amoy testnet // 2024/04/15
    } 
    else if(hre.network.name === 'matic')  {                           // Matic Mainnet for test
//    REGISTRY_ADDRESS   = "0x3E8A27dA0BF241f588141659cBb6Bd39717527F1"   // Version test
      REGISTRY_ADDRESS   = "0xb17facaca106fb3d216923db6cabfc7c0517029d"   // 2023/03/22: Normal Release
    } 
    else if(hre.network.name === 'celo_test')  {
      REGISTRY_ADDRESS   = "0x572e9B8B210414b2D76ddf578925D769D96982E6"   // ArkreenRegistry for celo testnet
    }     
    else if(hre.network.name === 'celo')  {
      REGISTRY_ADDRESS   = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"   // ArkreenRegistry for celo mainnet
    }     

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECBadge, deployer);  
    const ArkreenBadge = await deploy(CONTRACTS.RECBadge, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [REGISTRY_ADDRESS]
            },
//            onUpgrade: {
//              methodName: "postUpdate", // method to be executed when the proxy is upgraded (not first deployment)
//              args: [],
//            },               
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    console.log("ArkreenBadge deployed to %s: ", hre.network.name, ArkreenBadge.address);
};

// 2023/03/22
// yarn deploy:matic:RECBadge
// Proxy:           0x1e5132495cdaBac628aB9F5c306722e33f69aa24
// Implementation:  0xA64514F4e2BA27FF40Ca923319d1e715477b1A05

// 2023/05/09
// yarn deploy:matic:RECBadge （Wrong action）
// Proxy:           0x7d2b911724398a82bed941625e87e8a0f519826a
// Implementation:  0x85AfA2799622cAeC66B169865476060507aF5aDE

// 2023/05/09
// yarn deploy:matic_test:RECBadge
// Proxy:           0x626f470Ae1427d01f0Fab4D79BC0c9748b07325d
// Implementation:  0xC15de762EB03644ad92d45091E52d840594c6CB2

// 2023/08/21
// yarn deploy:celo_test:RECBadge
// Proxy:           0x9b5EE14b0B23876F39747747b227dDe12B62143d
// Implementation:  0xF78E8576688284a51e783a3E730DCE8C6Aa686CC

// 2023/11/01
// yarn deploy:celo:RECBadge
// Proxy:           0x5EfbbB0a60110cCda7342A7230A32A4E78815f76
// Implementation:  0x8aA572eE9c7991dc059a2Ae18844858B1Eb274F0

// 2024/04/15
// yarn deploy:matic_test:RECBadge
// Proxy:           0x8a459D94F30dB4FC5b6e8F1950d67287AF0Bc77C
// Implementation:  0x4db0ba23261Fd5905d0Ba15b3eb35F334BeEbEA5

func.tags = ["RECBadge"];

export default func;
