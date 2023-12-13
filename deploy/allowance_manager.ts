import { ethers } from "hardhat";
import { ArkreenToken__factory } from "../typechain";

async function main() {
  // const address = getAddress();
  const tokenAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';    // cUSD of CELO
  const targetAddress = '0x66e9c20de3711e7c8c886d461aacd6e092e161be';   // 
  const new_allowance = '0'

  const [deployer] = await ethers.getSigners();
  const tokenFactory = ArkreenToken__factory.connect(tokenAddress, deployer);

  const old_allowance = await tokenFactory.allowance(deployer.address, targetAddress)

  const removeAllowance = await tokenFactory.approve(targetAddress, new_allowance)
  await removeAllowance.wait()

  console.log('Previous allowance:', old_allowance, new_allowance)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
