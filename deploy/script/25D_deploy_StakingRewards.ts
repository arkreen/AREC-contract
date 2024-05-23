import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    const stakingRewards = await deploy('StakingRewards', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("USDT deployed to %s: ", hre.network.name, stakingRewards.address);
};

// 2024/05/21: Change RewardAdded event and 1e28 -> 1e36
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0x4A1276c15821c1ebf76542724E5b81EDe37C7b24

// 2024/05/22: Add: getBasicStakeStatus and getUserStakeStatus
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0x61A914363Ef99AabCa69504cee5ccfd5523C845d

// 2024/05/22: correct: getUserStakeStatus
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0x7370c2166D7720c41F0931f0bbF67e10d00B0D18

// 2024/05/23: correct: getBasicStakeStatus
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0x71D65c314C7F2f0F2d332825e0db2dA818386b7E

// 2024/05/23A: correct: getBasicStakeStatus
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0xf674A664f66E4f7eC8A582D3ea12007883C93Eb4

// 2024/05/23B: correct: getBasicStakeStatus
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0x5BF719CcF15b730a0b74a933c18c94b9B2516D75

// 2024/05/23C: correct: getBasicStakeStatus
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0xfFdD75c441a50cBf9aAEA3984Dc174D2352C309F


func.tags = ["StakingRewardsD"];

export default func;
