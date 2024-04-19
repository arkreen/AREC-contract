import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(250_000_000_000)

    console.log("Deploying: ", CONTRACTS.RECToken, deployer);  

    const ArkreenRECToken = await deploy(CONTRACTS.RECToken, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    console.log("ArkreenRECToken deployed to %s: ", hre.network.name, ArkreenRECToken.address);
};

// 2023/03/03: Upgrade to support tracing back AREC NFT based on asset type
// yarn deploy:matic_test:RECTokenD
// 0x5238a537aD184198d79ED52EeE10907f56438584

// 2023/12/12: New implementation for AREC Bridge tokens deployment
// yarn deploy:matic_test:RECTokenD
// 0x0a451317bb231ba332340ef63d7da926f669c614

// 2024/01/27: Upgrade to support charging Offfset fee 
// yarn deploy:matic_test:RECTokenD
// 0x4F86bfe6D41844008a12e9397971c4C9786FfcC3

// 2024/02/03: Upgrade to support charging Offset fee, and removing code regarding triggerUpgradeAmount  
// yarn deploy:matic:RECTokenD
// 0x8fABa56a1636AFda9DD84Cb1826eAaF44db05087

// 2024/04/11: Upgrade to support Bridge REC liquidization loop and Offset status tracking
// yarn deploy:matic:RECTokenD
// 0x188E8F524CE105ba4bBe9421516EfABbFD6824a4

// 2024/04/16: Upgrade to support using different offsetMappingLimit
// yarn deploy:matic:RECTokenD
// 0x0D13dD754f90215613748f8685F5ff96601d48D5

// 2024/04/18: Upgrade to fix a bug in Bridge REC liquidization loop and Offset status tracking
// yarn deploy:matic:RECTokenD
// 0x20fa37EEBF8816Ea54976E16B0f1581f7Bbc4230

// 2024/04/19: Upgrade on Amoy testnet to fix a bug in Bridge REC liquidization loop and Offset status tracking
// yarn deploy:matic_test:RECTokenD
// 0xB9a4Bf4F7a31ac163e86369E834eec1009746D25

func.tags = ["RECTokenD"];

export default func;
