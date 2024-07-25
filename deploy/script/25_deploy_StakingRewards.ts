import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { StakingRewards__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(35_000_000_000) : BigNumber.from(50_000_000_000)

    let tokenAKRE = ''
    let tokenART = ''
    let minerContract = ''
    let rewardsDistributor = ''
    
    if(hre.network.name === 'matic_test')  {
      // 2024/05/16: AKRE on Amoy testnet                        
      tokenAKRE = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
      tokenART = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"
      minerContract = "0xF390caaF4FF0d297e0b4C3c1527D707C75541736"
      rewardsDistributor = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"
    } else if(hre.network.name === 'matic')  {
      tokenAKRE           = "0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3"
      tokenART            = "0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF"
      minerContract       = "0xbf8eF5D950F78eF8edBB8674a48cDACa675831Ae"
      rewardsDistributor  = "0x1249B1eABcAE642CF3Cb1e512a0075CEe92769BE"
    } 

    console.log("Deploying: ", "StakingRewards", deployer);  
/*
    const stakingRewards = await deploy("StakingRewards", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [tokenAKRE, tokenART, minerContract, rewardsDistributor]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
*/

    // 2024/06/21
    // const IMPLEMENTATION_ADDRESS ="0x7758f24068A5E2c1dea3D1D82Fa933356b35f8c5" // Amoy testnet
    const IMPLEMENTATION_ADDRESS ="0x38021bD40a92baFED6B54B282013190755c729AE"    // 2024/06/25: Polygon mainnet
        
    const callData = StakingRewards__factory.createInterface().encodeFunctionData("initialize", [tokenAKRE, tokenART, minerContract, rewardsDistributor])
    const stakingRewards = await deploy(CONTRACTS.UUPSProxy, {
            from: deployer,
            args: [IMPLEMENTATION_ADDRESS, deployer, callData],
            log: true,
            skipIfAlreadyDeployed: true,
            gasPrice: defaultGasPrice
    });

    console.log("stakingRewards deployed to %s: ", hre.network.name, stakingRewards.address);
};

// 2024/05/16
// yarn deploy:matic_test:StakingRewards    : Amoy testnet (Dev Anv)
// Proxy:                 0x691938a6e88a85E66Aab05ECf84Fe84ECE8351C9
// Implementaion:         0x529D9956844af588b6B6Bc8eA6c8F80CaF5ac7B9

// 2024/05/22
// yarn deploy:matic_test:StakingRewards    : Amoy testnet (Dev Anv)
// Proxy:                 0xe233f1aC801eD919A774295503eCFE359A647B8B （UUPS）
// Implementaion:         0xe07968E3b0D64B99EA3653Dd925a850eBb9a3Bb9

// 2024/05/28
// yarn deploy:matic:StakingRewards    : Polygon mainnet
// Proxy:                 0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F
// Implementaion:         0x7D2Cebe75a5D46cee170A3aAC175453673125A9E

// 2024/06/21
// yarn deploy:matic_test:StakingRewards: Amoy testnet (Dev Anv), depploy 3 new proxy contract for 3 durations. 
// Proxy1:                0x1f74d233c159Eb99a81FB067076cf2C86D5a3F06
// Proxy2:                0x09806c44a1a87A5Db3d3b21839C8eDB6049355B5
// Proxy3:                0xDfDe48f6A4E57989c8916D9f9f467803D36E6412
// Implementaion:         0x7758f24068A5E2c1dea3D1D82Fa933356b35f8c5

// 2024/06/25
// yarn deploy:matic:StakingRewards    : Polygon mainnet
// Proxy:                 0x4C15968df54B276dC06eF11Bcd3b3EfFbC577c59  (XXXXXXXX: no lock feature)
// Implementaion:         0x7D2Cebe75a5D46cee170A3aAC175453673125A9E

// 2024/06/25A
// yarn deploy:matic:StakingRewards    : Polygon mainnet with lock feature
// Proxy:                 0xc1dCE2f17362C2De4ab4F104f6f88223e0c28B95
// Implementaion:         0x38021bD40a92baFED6B54B282013190755c729AE

// 2024/07/25A
// yarn deploy:matic:StakingRewards    : Polygon mainnet with lock feature
// Proxy:                 0x0A0688fc15794035820CaDc23Db7114bAb4dE405  (Proxy)
// Implementaion:         0x38021bD40a92baFED6B54B282013190755c729AE

// 2024/07/25B
// yarn deploy:matic:StakingRewards    : Polygon mainnet with lock feature
// Proxy:                 0x071Bed72c917859e73f99dDa41Fb6B2Ea4C08d33  (Proxy)
// Implementaion:         0x38021bD40a92baFED6B54B282013190755c729AE

func.tags = ["StakingRewards"];

export default func;
