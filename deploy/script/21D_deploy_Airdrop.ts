import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber, constants } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6_000_000_000) : BigNumber.from(80_000_000_000)

  console.log("Deploying Airdrop", deployer, defaultGasPrice.toString());

  // MATIC Test net
  //const AKRE_ADDRESS  = "0xaCfA889411fDeCB0F8C16f95c8f869a9D56A3559"     // 2024/03/1: Test Token on Matic testnet
  //const airDropValue = BigNumber.from(0)

  // Polygon mainnet
  const AKRE_ADDRESS  = "0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3"     // 2024/03/1A: AKRE on Polygon maninet
  const airDropValue = BigNumber.from(0)


  const AirdropContract = await deploy('Airdrop', {
      from: deployer,
      args: [AKRE_ADDRESS, constants.AddressZero, airDropValue],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("Airdrop deployed to %s: ", hre.network.name, AirdropContract.address);
};

// 2024/03/01: Deploy matic testnet: Airdrop
// yarn deploy:matic_test:AirdropD
// 0xC8076C5644e97f7F3382a4D4d044d0a65b977e38

// 2024/03/01A: Deply Polygon mainnet: Airdrop
// yarn deploy:matic:AirdropD
// 0x53e712e31f9899D2f85f6fAa6e7D21Ea399b3f4a

func.tags = ["AirdropD"];

export default func;
