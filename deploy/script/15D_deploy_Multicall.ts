import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", 'Multicall', deployer);  

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100_000_000_000)

  //const Multicall = await deploy('./contracts/test/Multicall.sol/Multicall', {
  const Multicall = await deploy('MulticallS', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("Multicall deployed to %s: ", hre.network.name, Multicall.address);
};

// 2023/07/18
// deploy:matic:MulticallD
// 0xe15F1eDC35e987604C8658aCE8c0A75d4F23a030

// 2023/07/19
// deploy:matic_test:MulticallD
// 0x3a004D2777F3099f428ec45593636BcA69515B85

// 2023/08/05
// deploy:matic_test:MulticallD:  Address address to the returned data
// 0x0836851450d157FeAb2c84850f7907Ab563006Be

// 2023/08/30
// deploy:celo_test:MulticallD:  deployed on Celo Testnet
// 0xB8663EdC9929D9135E7f6D50f7d3A97862554a72

// 2023/11/01
// deploy:celo:MulticallD:  deployed on Celo mainnet
// 0xB63e71D6FB9F0b3717239474E6BD189930a3F201

// 2024/02/28
// deploy:matic_test:MulticallD:  deployed on mumbi testnet to add checkIfContract 
// 0x693a7f1dc9c9fee79c4c6c33f4515bf19493d4b3, 
// 0x4aa366702b747f44ba3373968ce4289c0fb38555

// 2024/02/28A
// deploy:matic:MulticallD:  deployed on Polygon mainet to add checkIfContract 
// 0x701de9963521b0c2e1495d902082479ad6e76b59

// 2024/04/12
// deploy:matic:MulticallD:  deployed on Polygon mainet to return ETH/MATIC value in aggregate
// 0xB1C60361396Fb1136c015ac0Fc3823E5d3fa3067

// 2024/04/16
// deploy:matic_test:MulticallD:  deployed on Polygon Amoy testnet
// 0xabaC2B8525D05A56B1D6d821c4eE2d9292bb61B4
// 0xf5d1d0aa8f827c0d975630e006e77690765fbf85

// 2024/07/13
// deploy:matic:MulticallD:  deployed on Polygon mainnet: add listEmptyGreenBTC
// 0x825f013933d6376A9041DD5515dC778195532AB7   (Not new )

// 2024/07/13A
// deploy:matic:MulticallD:  deployed on Polygon mainnet: add listEmptyGreenBTC
// 0x6a4341ffe4a4b5bd71da3c8d5052b03bf1b3f0c0

// 2024/07/14
// deploy:matic:MulticallD:  deployed on Polygon mainnet: add listEmptyGreenBTC（Fix listEmptyGreenBTC）
// 0x19e9BAD19ca2696b509d938476ee4CF823538df4

// 2024/07/19
// deploy:matic:MulticallD:  deployed on Polygon mainnet: getAllBalance
// 0xBCCa2cCEab5dB4b04D950ED93DF8B702da08DA43

func.tags = ["MulticallD"];

export default func;
