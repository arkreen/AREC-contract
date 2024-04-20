import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(120_000_000_000)

    console.log("Deploying: ", CONTRACTS.RECBadge, deployer);  

    const ArkreenBadge = await deploy(CONTRACTS.RECBadge, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
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

// 2023/04/18: Upgrade to remove the 3-day limitation of updateCertificate and SBT limitation
// yarn deploy:matic:RECBadgeD
// 0x968848f24Aacfe2F3f2BD7169B7a1d5669091Eaf

// 2023/04/18: restore SBT limitation
// yarn deploy:matic:RECBadgeD
// 0xE6264Ed46380BBf28AEF18ECB2fD1F4C92aa59F5

// 2023/06/14: add getOffsetDetails to make pdf generation possible
// yarn deploy:matic_test:RECBadgeD
// 0x8Cd3372C871A6D9F8777B54483d6c27377C128eF

// 2023/07/11: Deploy the latest Badge contract: add getOffsetDetails to make pdf generation possible
// yarn deploy:matic:RECBadgeD
// 0x0A4E902c05F2eb26D6796e1649879c1201436E11

// 2024/01/01: Deploy Badge contract supporting image url and event OffsetAttached
// yarn deploy:matic_test:RECBadgeD
// 0x978808Ee68CB73188f8b5b33625a72F0bb1E5b5F

// 2024/02/22: Deploy Badge contract supporting image url and event OffsetAttached
// yarn deploy:matic:RECBadgeD
// 0x2b12BBf2213Ccbb4685106D50E7D7dff760e7E1D

// 2024/04/11: Deploy badge contract supporting Bridge REC liquidization loop and Offset status tracking
// yarn deploy:matic:RECBadgeD
// 0x6945bb796a83A2fEAbD7cd29AaaFD84626695B3d

// 2024/04/20: Deployed on Polygon Amoy testnet 
// yarn deploy:matic_test:RECBadgeD
// 0xC395EED5977a1AFD74ba6fDf0E8A62D2d11065D1

func.tags = ["RECBadgeD"];

export default func;
