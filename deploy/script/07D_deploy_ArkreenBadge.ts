import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECBadge, deployer);  

    const ArkreenBadge = await deploy(CONTRACTS.RECBadge, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenBadge deployed to %s: ", hre.network.name, ArkreenBadge.address);
};

// 2023/02/26: 
// yarn deploy:matic_test:RECBadgeD
// 0xD12E75566CeAa2bA669EDEbBA524359D7564b2c5

// 2023/03/02: 
// yarn deploy:matic_test:RECBadgeD
// 0x619f4a175B17C51cC11e7afB85e50a78b3899900

// 2023/03/03: Upgrade to trace back AREC NFT based on asset type
// yarn deploy:matic_test:RECBadgeD
// 0x2cc8fFc86eAbdAA486d5408C8813813eb60b507a

// 2023/04/02: Upgrade to support updateCID
// yarn deploy:matic:RECBadgeD
// 0xC51678BFd8e108F12CC3e5cb80F3067Bd6aEd323

func.tags = ["RECBadgeD"];

export default func;
