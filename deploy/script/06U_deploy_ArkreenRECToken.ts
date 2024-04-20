import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECToken__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  console.log("Update ArkreenRECToken: ", CONTRACTS.RECToken, deployer.address);  

  const { getChainId } = hre;
  const chainID = await getChainId()
  const defaultGasPrice = (chainID === '80001') ? BigNumber.from(3_000_000_000) : BigNumber.from(150_000_000_000)

  if(hre.network.name === 'matic_test') {
//    const RECTOKEN_ADDRESS    = "0xb0c9dd915f62d0a37792fd2ce497680e909d8c0f"      // Need to check: Simulation mode
//    const RECTOKEN_ADDRESS    = "0x0999AFb673944a7B8E1Ef8eb0a7c6FFDc0b43E31"      // Need to check: Simulation: HashKey HART
//    const RECTOKEN_ADDRESS    = "0xd1348bb43dbf51a2446db6e40de5f6c178cb2d47"      // Need to check: MATIC Testnet      
//    const RECTOKEN_ADDRESS    = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"      // Need to check: MATIC Amoy Testnet 
      const RECTOKEN_ADDRESS    = "0x78A2620C3fb96100Dc551Db657005eEeF270F0DF"      // Need to check: CART: MATIC Amoy Testnet 

//    const NEW_IMPLEMENTATION  = "0x87f36c015a23a9e0f15fcb7f62d566a8f4a16209"      // 1.Old implemenation
//    const NEW_IMPLEMENTATION  = "0x67b31C71c4E438a04dDA41dBCf5d2F174d43d69B"      // 2. Add Solidify 
//    const NEW_IMPLEMENTATION  = "0x6DAf30bF36379641E73Ebc6b4755E28bC97091D3"      // 3. make fields public //both simu and testnet
//    const NEW_IMPLEMENTATION  = "0xc0e5543d8bb04dfa26e176dbb1418da923f3981d"      // 4. Add numberAREC to Solidify event
//    const NEW_IMPLEMENTATION  = "0xb2d9199071DC648c5F0D7F9e5c8e7c7e7d2e1e6B"      // 5. Return numberAREC in Solidify
//    const NEW_IMPLEMENTATION  = "0x319334463C5d18D5bD45cC6d6eB27216F712906E"      // 6. Add getARECInfo(uint256 number)
//    const NEW_IMPLEMENTATION  = "0x19e9BAD19ca2696b509d938476ee4CF823538df4"      // 7. 2023/03/03: Upgrade for HashKey

//    const NEW_IMPLEMENTATION  = "0xf05CDd31b95C80D4DA67DFf799F866938A54A2E8"      // 6. Add getARECInfo(uint256 number)
//    const NEW_IMPLEMENTATION  = "0x19e9BAD19ca2696b509d938476ee4CF823538df4"      // 7. 2023/03/28: Upgrade for HashKey
//    const NEW_IMPLEMENTATION  = "0x19e9BAD19ca2696b509d938476ee4CF823538df4"      // 7. 2023/03/28: Upgrade for HashKey
//    const NEW_IMPLEMENTATION  = "0x4F86bfe6D41844008a12e9397971c4C9786FfcC3"      // 7. 2024/01/27: Upgrade for charging offset fee
//    const NEW_IMPLEMENTATION  = "0xB9a4Bf4F7a31ac163e86369E834eec1009746D25"      // 8. 2024/04/19: Upgrade on Amoy testnet to fix a bug in Bridge REC liquidization loop and Offset status tracking
      const NEW_IMPLEMENTATION  = "0x2f402E1863A106455d39CEa20874b9CC21eeFf80"      // 9. 2024/04/20: Upgrade on Polygon Amoy testnet to fix the bug regarding bridged REC offset

      const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(RECTOKEN_ADDRESS, deployer);

//    const callData = ArkreenRECTokenFactory.interface.encodeFunctionData("postUpdate")
//    const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
//    const updateTx = await ArkreenRECTokenFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
      
      const updateTx = await  ArkreenRECTokenFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()

      console.log("callData, update", updateTx)
      console.log("ArkreenRECToken Updated to %s: ", hre.network.name, ArkreenRECTokenFactory.address, NEW_IMPLEMENTATION);
  } 

  if(hre.network.name === 'matic') {
    // const RECTOKEN_ADDRESS    = "0x815bFE3aaCF765c9E0A4DdEb98Ad710a4Fb860d3"     // Need to check
    // const RECTOKEN_ADDRESS    = "0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF"        // Need to check, ART on MATIC Mainnet
    const RECTOKEN_ADDRESS    = "0x0D7899F2D36344ed21829D4EBC49CC0d335B4A06"     // Need to check, cART on MATIC Mainnet
    // const RECTOKEN_ADDRESS       = "0x93b3bb6C51A247a27253c33F0d0C2FF1d4343214"     // Need to check, HART on MATIC Mainnet

    // const NEW_IMPLEMENTATION  = "0xbdb320004dd108bd6bbba948db992f7b4b3bdbf4"     // 1. Old implemenation
    // const NEW_IMPLEMENTATION  = "0x1356Dc92E42a8fB17f2A5AE747543E4d3ADED899"     // 2. Add solidity and offset traceback
    // const NEW_IMPLEMENTATION  = "0x69B7231876608Bdb3Cf9c0C7303620C375Df0aB3"     // 6. Add getARECInfo(uint256 number)
    // const NEW_IMPLEMENTATION  = "0x8fABa56a1636AFda9DD84Cb1826eAaF44db05087"     //2024/02/03: Upgrade to support charging Offset fee, and removing code regarding triggerUpgradeAmount 
    // const NEW_IMPLEMENTATION  = "0x188E8F524CE105ba4bBe9421516EfABbFD6824a4"     //2024/04/11: Upgrade to support Bridge REC liquidization loop and Offset status tracking
    // const NEW_IMPLEMENTATION  = "0x0D13dD754f90215613748f8685F5ff96601d48D5"     //2024/04/17: Upgrade to support using different offsetMappingLimit
    // const NEW_IMPLEMENTATION  = "0x20fa37EEBF8816Ea54976E16B0f1581f7Bbc4230"     //2024/04/18: Upgrade to fix a bug in Bridge REC liquidization loop and Offset status tracking
    const NEW_IMPLEMENTATION  = "0x87376Ae3940AC7790E4354242883349553D8973d"        //2024/04/20: UUpgrade on Polygon mainnet to fix the bug regarding bridged REC offset

    const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(RECTOKEN_ADDRESS, deployer);

/*    
    const callData = ArkreenRECTokenFactory.interface.encodeFunctionData("postUpdate")
    //const updateTx = ArkreenRECManagerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])
    const updateTx = await ArkreenRECTokenFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    console.log("callData, update", updateTx)
*/

    const updateTx = await ArkreenRECTokenFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice} )
    console.log("callData, update", updateTx)

    await updateTx.wait()
    console.log("ArkreenRECToken Updated to %s: ", hre.network.name, ArkreenRECTokenFactory.address);
  } 

};

// 2024/01/27: Upgrade for charging offset fee: ART(0xb0c9dd915f62d0a37792fd2ce497680e909d8c0f)
// yarn deploy:matic_test:RECTokenU
// 0x4F86bfe6D41844008a12e9397971c4C9786FfcC3

// 2024/01/27:A: Upgrade for charging offset fee: HART(0x0999AFb673944a7B8E1Ef8eb0a7c6FFDc0b43E31)
// yarn deploy:matic_test:RECTokenU
// 0x4F86bfe6D41844008a12e9397971c4C9786FfcC3

// 2024/02/03: Upgrade ART on Polygon mainnet to support charging Offset fee, and removing code regarding triggerUpgradeAmount
// yarn deploy:matic:RECTokenU
// 0x8fABa56a1636AFda9DD84Cb1826eAaF44db05087

// 2024/02/03B: Upgrade cART on Polygon mainnet to support charging Offset fee, and removing code regarding triggerUpgradeAmount
// yarn deploy:matic:RECTokenU
// 0x8fABa56a1636AFda9DD84Cb1826eAaF44db05087

// 2024/02/03C: Upgrade HART on Polygon mainnet to support charging Offset fee, and removing code regarding triggerUpgradeAmount
// yarn deploy:matic:RECTokenU
// 0x8fABa56a1636AFda9DD84Cb1826eAaF44db05087

// 2024/04/11: Upgrade to support Bridge REC liquidization loop and Offset status tracking
// yarn deploy:matic:RECTokenU
// 0x188E8F524CE105ba4bBe9421516EfABbFD6824a4

// 2024/04/17: Upgrade to support using different offsetMappingLimit
// yarn deploy:matic:RECTokenU
// 0x0D13dD754f90215613748f8685F5ff96601d48D5

// 2024/04/18: Upgrade to fix a bug in Bridge REC liquidization loop and Offset status tracking
// yarn deploy:matic:RECTokenU
// 0x20fa37EEBF8816Ea54976E16B0f1581f7Bbc4230

// 2024/04/19: Upgrade on Amoy testnet to fix a bug in Bridge REC liquidization loop and Offset status tracking
// yarn deploy:matic_test:RECTokenU
// 0xB9a4Bf4F7a31ac163e86369E834eec1009746D25

// 2024/04/20A: For CART: Upgrade on Amoy testnet to fix a bug in Bridge REC liquidization loop and Offset status tracking
// yarn deploy:matic_test:RECTokenU
// 0xB9a4Bf4F7a31ac163e86369E834eec1009746D25

// 2024/04/20B: For ART: Upgrade on Polygon Amoy testnet to fix the bug regarding bridged REC offset
// yarn deploy:matic_test:RECTokenU
// 0x2f402E1863A106455d39CEa20874b9CC21eeFf80

// 2024/04/20C: For CART: Upgrade on Polygon Amoy testnet to fix the bug regarding bridged REC offset
// yarn deploy:matic_test:RECTokenU
// 0x2f402E1863A106455d39CEa20874b9CC21eeFf80

// 2024/04/20D: For ART: Upgrade on Polygon mainnet to fix the bug regarding bridged REC offset
// yarn deploy:matic:RECTokenU
// 0x87376Ae3940AC7790E4354242883349553D8973d

// 2024/04/20E: For CART: Upgrade on Polygon mainnet to fix the bug regarding bridged REC offset
// yarn deploy:matic:RECTokenU
// 0x87376Ae3940AC7790E4354242883349553D8973d

func.tags = ["RECTokenU"];

export default func;