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

func.tags = ["RECTokenD"];

export default func;
