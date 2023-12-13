import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECToken, deployer);  

    const ArkreenRECToken = await deploy(CONTRACTS.RECToken, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenRECToken deployed to %s: ", hre.network.name, ArkreenRECToken.address);
};

// 2023/03/03: Upgrade to support tracing back AREC NFT based on asset type
// yarn deploy:matic_test:RECTokenD
// 0x5238a537aD184198d79ED52EeE10907f56438584

// 2023/12/12: New implementation for AREC Bridge tokens deployment
// yarn deploy:matic_test:RECTokenD
// 0x0a451317bb231ba332340ef63d7da926f669c614

func.tags = ["RECTokenD"];

export default func;
