import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
//import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const arkReward = "ArkreenReward"

    // Need to check and update !!!!!
//  const AKRE_TOKEN_ADDRESS    = "0x960c67b8526e6328b30ed2c2faea0355beb62a83"  
//  const VALIDATOR_ADDRESS     = "0x25C3f0Ea82E318b3488adfB3f4cbE76b49508B1c"  

    // 2023/05/16: Open testnet
    const AKRE_TOKEN_ADDRESS    = "0x21B101f5d61A66037634f7e1BeB5a733d9987D57"
    const VALIDATOR_ADDRESS     = "0x741e2403b63a41188e72dc3897d730a746d9181e"

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", arkReward, deployer);  
    const ArkreenReward = await deploy(arkReward, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [AKRE_TOKEN_ADDRESS, VALIDATOR_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenReward deployed to %s: ", hre.network.name, ArkreenReward.address);
};

// 2023/05/16: Open testnet
// yarn deploy:matic:arkReward  
// Proxy:           0x44082E783bA0aBB62975e77E48aF355B2bF3d440         
// Implementaion:   0x2f47c3346300ca8c04e0af15c527216f5363910c

func.tags = ["arkReward"];

export default func;
