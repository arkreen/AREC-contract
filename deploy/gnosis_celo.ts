import { ethers } from "hardhat";
import { GnosisSafeProxyFactory__factory } from "../typechain";
import { BigNumber } from "ethers";

async function main() {

  const [owner, ConfirmAccount] = await ethers.getSigners();
  console.log('Account',  owner.address, ConfirmAccount.address)
  
  // 0	_singleton	address	0x3E5c63644E683549055b9Be8653de26E0B4CD36E
  // 1	initializer	bytes	0xb63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000f48f2b2d2a534e402487b3ee7c18c33aec0fe5e4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000044cb2da03aa74138391e635ef35f166ed61b988c000000000000000000000000a2235a35e236d069630049878adb691e4180037c0000000000000000000000000000000000000000000000000000000000000000
  // 2	saltNonce	uint256	1684479265146

  const PROXY_FACORY_ADDRESS = "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2"       // Need to check
  const SINGLETON_ADDRESS = "0x3E5c63644E683549055b9Be8653de26E0B4CD36E"          // Need to check
  const initializer = "0xb63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000f48f2b2d2a534e402487b3ee7c18c33aec0fe5e4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000044cb2da03aa74138391e635ef35f166ed61b988c000000000000000000000000a2235a35e236d069630049878adb691e4180037c0000000000000000000000000000000000000000000000000000000000000000"
  const saltNonce = BigNumber.from("1684479265146")

  const gnosisSafeProxyFactory = GnosisSafeProxyFactory__factory.connect(PROXY_FACORY_ADDRESS, owner);
  await gnosisSafeProxyFactory.calculateCreateProxyWithNonceAddress(SINGLETON_ADDRESS, initializer, saltNonce)

  console.log("Current Confirmation:", gnosisSafeProxyFactory.address, owner.address, (new Date()).toLocaleString())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
