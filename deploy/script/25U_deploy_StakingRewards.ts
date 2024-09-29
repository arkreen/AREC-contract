import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { GreenBTC__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { getChainId } = hre;

  const chainID = await getChainId()
  const defaultGasPrice = (chainID === '80001') ? BigNumber.from(3_000_000_000) : BigNumber.from(50_000_000_000)
  
  if(hre.network.name === 'matic_test') {

    // const STAKE_REWARD_PROXY_ADDRESS  = "0x691938a6e88a85E66Aab05ECf84Fe84ECE8351C9"   // 2024/05/16: StakingRewards on Amoy testnet
    // const STAKE_REWARD_PROXY_ADDRESS  = "0xe233f1aC801eD919A774295503eCFE359A647B8B"   // 2024/05/22: StakingRewards Re-deploy on Amoy testnet
    // const STAKE_REWARD_PROXY_ADDRESS  = "0x83A53493180677DBF298b5C9f454DED4f73FD0F1"      // 2024/09/25: StakingRewards: 30D, AKRE
    const STAKE_REWARD_PROXY_ADDRESS  = "0xa2c7FD9d6F9fCD50000DAaC552d931E0185D3Be6"   // 2024/09/25: StakingRewards: 60D, AKRE
    
    // const NEW_IMPLEMENTATION       = "0x4A1276c15821c1ebf76542724E5b81EDe37C7b24"  // 2024/05/21: Change RewardAdded event
    // const NEW_IMPLEMENTATION       = "0x61A914363Ef99AabCa69504cee5ccfd5523C845d"  // 2024/05/22: Add getBasicStakeStatus and getUserStakeStatus
    // const NEW_IMPLEMENTATION       = "0x7370c2166D7720c41F0931f0bbF67e10d00B0D18"  // 2024/05/22: Correct getUserStakeStatus
    // const NEW_IMPLEMENTATION       = "0x71D65c314C7F2f0F2d332825e0db2dA818386b7E"  // 2024/05/23: Correct getBasicStakeStatus
    // const NEW_IMPLEMENTATION       = "0xf674A664f66E4f7eC8A582D3ea12007883C93Eb4"  // 2024/05/23A: Correct getBasicStakeStatus
    // const NEW_IMPLEMENTATION       = "0x5BF719CcF15b730a0b74a933c18c94b9B2516D75"  // 2024/05/23B: Correct getBasicStakeStatus
    // const NEW_IMPLEMENTATION       = "0xfFdD75c441a50cBf9aAEA3984Dc174D2352C309F"  // 2024/05/23C: Correct getBasicStakeStatus
    // const NEW_IMPLEMENTATION       = "0x2e50A76D8C334315583617Df5c02420Ff166b6B0"  // 2024/05/23D: Correct getBasicStakeStatus
    // const NEW_IMPLEMENTATION       = "0x1FAc329c4f9556654e0beCb527977228100F7742"  // 2024/05/23E: Correct getBasicStakeStatus
    // const NEW_IMPLEMENTATION       = "0x7758f24068A5E2c1dea3D1D82Fa933356b35f8c5"  // 2024/06/18: Add staking locking feature
    const NEW_IMPLEMENTATION          = "0x8653e707071f45A25e348187F8236C9e71eF33d4"  // 2024/09/25: Removing boost feature

    console.log("Updating StakingRewards: ", STAKE_REWARD_PROXY_ADDRESS, chainID, defaultGasPrice.toString());  

    const [deployer] = await ethers.getSigners();
    const GreenBTCFactory = GreenBTC__factory.connect(STAKE_REWARD_PROXY_ADDRESS, deployer);
    const updateTx = await GreenBTCFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

    console.log("Upgrading StakingRewards is executed: %s: ", hre.network.name, NEW_IMPLEMENTATION);
  } 

  if(hre.network.name === 'matic') {
    const STAKE_REWARD_PROXY_ADDRESS  = ""  
    const NEW_IMPLEMENTATION      = ""     
  } 
};

// 2024/05/21: Upgrade on Amoy mainet to Change RewardAdded event
// yarn deploy:matic_test:StakingRewardsU: 0x4A1276c15821c1ebf76542724E5b81EDe37C7b24

// 2024/05/22: Add getBasicStakeStatus and getUserStakeStatus
// yarn deploy:matic_test:StakingRewardsU: 0x61A914363Ef99AabCa69504cee5ccfd5523C845d

// 2024/05/22A: Correct getUserStakeStatus
// yarn deploy:matic_test:StakingRewardsU: 0x7370c2166D7720c41F0931f0bbF67e10d00B0D18

// 2024/05/23: Correct getBasicStakeStatus
// yarn deploy:matic_test:StakingRewardsU: 0x71D65c314C7F2f0F2d332825e0db2dA818386b7E

// 2024/05/23: Correct getBasicStakeStatus
// yarn deploy:matic_test:StakingRewardsU: 0xf674A664f66E4f7eC8A582D3ea12007883C93Eb4

// 2024/05/23: Correct getBasicStakeStatus for 0xe233f1aC801eD919A774295503eCFE359A647B8B
// yarn deploy:matic_test:StakingRewardsU: 0xf674A664f66E4f7eC8A582D3ea12007883C93Eb4

// 2024/05/23B: Correct getBasicStakeStatus for 0xe233f1aC801eD919A774295503eCFE359A647B8B
// yarn deploy:matic_test:StakingRewardsU: 0x5BF719CcF15b730a0b74a933c18c94b9B2516D75

// 2024/05/23C: Correct getBasicStakeStatus for 0xe233f1aC801eD919A774295503eCFE359A647B8B
// yarn deploy:matic_test:StakingRewardsU: 0xfFdD75c441a50cBf9aAEA3984Dc174D2352C309F

// 2024/05/23D: Correct getBasicStakeStatus for 0xe233f1aC801eD919A774295503eCFE359A647B8B
// yarn deploy:matic_test:StakingRewardsU: 0x2e50A76D8C334315583617Df5c02420Ff166b6B0

// 2024/05/23E: Correct getBasicStakeStatus for 0xe233f1aC801eD919A774295503eCFE359A647B8B
// yarn deploy:matic_test:StakingRewardsU: 0x1FAc329c4f9556654e0beCb527977228100F7742

// 2024/06/18: Add staking locking feature for 0xe233f1aC801eD919A774295503eCFE359A647B8B
// yarn deploy:matic_test:StakingRewardsU: 0x7758f24068A5E2c1dea3D1D82Fa933356b35f8c5

// 2024/09/25A: Removing boost feature for 0x83A53493180677DBF298b5C9f454DED4f73FD0F1
// yarn deploy:matic_test:StakingRewardsU: 0x8653e707071f45A25e348187F8236C9e71eF33d4

// 2024/09/25B: Removing boost feature for 0xa2c7FD9d6F9fCD50000DAaC552d931E0185D3Be6
// yarn deploy:matic_test:StakingRewardsU: 0x8653e707071f45A25e348187F8236C9e71eF33d4

export default func;
func.tags = ["StakingRewardsU"];