import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.gRegistry, deployer);  
    const ArkreenRegistry = await deploy(CONTRACTS.gRegistry, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: []
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenRegistry deployed to %s: ", hre.network.name, ArkreenRegistry.address);
};

// 2023/03/22
// yarn deploy:matic:gRegistry
// Proxy:           0xb17facaca106fb3d216923db6cabfc7c0517029d
// Implementation:  0x8c2a6a03b4d2936b029e561acf9ddc502aca72fc

// 2023/05/09
// yarn deploy:matic_test:gRegistry (Dev environment)
// Proxy:          0xfEcbD33525d9B869e5f3CaB895cd6D7A666209ee
// Implementation: 0xb60adb684A682835819a8b4Be2dB6163dEaB393C

// 2023/08/21
// yarn deploy:celo_test:gRegistry
// Proxy:           0x572e9B8B210414b2D76ddf578925D769D96982E6
// Implementation:  0x1410A78563075891bB196E30a8e441F93B7CC98d

// 2023/10/31
// yarn deploy:celo:gRegistry
// Proxy:           0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83
// Implementation:  0x953AAc5A0205CCdD6E0b4107ffB0a0ef7155F5bE

func.tags = ["gRegistry"];

export default func;
