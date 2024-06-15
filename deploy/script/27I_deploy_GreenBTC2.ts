
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { StakingRewards__factory } from "../../typechain";
import { GreenBTC2__factory } from "../../typechain";
import { getGreenBitcoinClaimGifts, getGreenBitcoinClaimGiftsRaw  } from '../../test/utils/utilities'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'

import { BigNumber } from "ethers";
import { config as dotEnvConfig } from "dotenv"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer, signer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(75_000_000_000)

   
  if(hre.network.name === 'matic_test') {
    // 2024/06/13
    //const greenBTC2Address  = "0x20E45e53B813788C2D169D3D861A4C0Ae3bDD4eA"        // 2024/06/13: Amoy testnet
    //const greenBTC2Address  = "0x7670fE3CD59a43082214d070150Fa31D2054cB7a"        // 2024/06/15: Amoy testnet: Remove data from GreenBTC
    const greenBTC2Address  = "0x488D299fd805b4e8BBBE819986E85c22F8513A0E"          // 2024/06/15A: Amoy testnet: Change Claim Signature

    const greenBTC2 = GreenBTC2__factory.connect(greenBTC2Address, deployer);
    
/*    
    // 2024/06/13, 2024/06/15, 2024/06/15A: Amoy testnet
    const greenBTCGift = "0x644d45543027E72Ecb653732c1363584710FF609"
    const setStakeParameterTx = await greenBTC2.setGreenBTCGift(greenBTCGift, {gasPrice: defaultGasPrice})
    await setStakeParameterTx.wait()

    console.log("GreenBTC2 set GreenBTCGift: ", hre.network.name, greenBTC2Address, greenBTCGift);
      
    // 2024/06/15, 2024/06/15A: Amoy testnet
    const AKRE = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
    const USDT = "0xc7767ae828E4830e2f800981E573f333d1E492b5"

    const greenBTCGiftTx = await greenBTC2.approveGift([AKRE, USDT], {gasPrice: defaultGasPrice})
    await greenBTCGiftTx.wait()

    console.log("GreenBTC2 approveGift: ", hre.network.name, greenBTC2Address, AKRE, USDT );

    // 2024/06/15A: Amoy testnet
    const domainId = 1234
    const domainInfo = "0x1011121280000bb8000f00c803e8000001f405dc000000000102030051520000"

    const registerDomainTx = await greenBTC2.registerDomain(domainId, domainInfo, {gasPrice: defaultGasPrice})
    await registerDomainTx.wait()

    console.log("GreenBTC2 registerDomain: ", hre.network.name, greenBTC2Address, domainId, domainInfo );
*/   
    
    // 2024/06/15: Amoy testnet
    // const actionId = 1
    // const blockHeight = 8301453
    // const blockHash = "0x90fb8c8bd107cc235983afc51cb20166d41bec8264d76d0076d5600113551e8d"

    //const actionId = 2
    //const blockHeight = 8301596
    //const blockHash = "0x31290f580e308f391b7d6be04af57f8e4dce5446ab9dd5962c489c4785a436d0"

    //const actionId = 1
    //const blockHeight = 8313081
    //const blockHash = "0xb92789070a6893daf433b7aed820428217fa3d06999441ad203956eb83f02522"

    //const actionId = 2
    //const blockHeight = 8313098
    //const blockHash = "0xefcd529c85f8e98b5ac318170ffc60c41646af50663a5e4df9b6edf59c463e95"

    const actionId = 3
    const blockHeight = 8313108
    const blockHash = "0xa58cbf6ab8e7e3b8c48d9436db6702ecbdf1915bea57effdfaf3acfc9a9ee653"

    const digest = getGreenBitcoinClaimGifts(    // getGreenBitcoinClaimGifts getGreenBitcoinClaimGiftsRaw
                        'Green BTC Club',
                        greenBTC2.address,
                        actionId,
                        blockHeight,
                        blockHash,
                        80002
                      )
                     
//    const sig = await signer.signMessage(Buffer.from(digest.slice(2), 'hex'))   // Cannot get correct signature
//    const {v, r, s} = fromRpcSig(sig)
//    const sigA = await signer.signMessage(ethers.utils.arrayify(digest))
//    const {v: vA, r:rA, s:sA} = fromRpcSig(sigA)

    const privateKeyManager = process.env.MATIC_TESTNET_CONFIRM_KEY as string
    const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   

    await greenBTC2.connect(signer).openActionGifts(actionId, blockHeight, blockHash, {v, r, s}, {gasPrice: defaultGasPrice} )

    console.log("GreenBTC2 openActionGifts: ", hre.network.name, greenBTC2Address, actionId, blockHeight );
  
  }
  if(hre.network.name === 'matic') {
    // 2024/06/13
    const greenBTC2Address  = "0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F"           // 2024/06/13: Polygon Mainnet
    const greenBTC2 = StakingRewards__factory.connect(greenBTC2Address, deployer);
  }
};

// 2024/06/13: Call setGreenBTCGift (Amoy mainnet): 0x644d45543027E72Ecb653732c1363584710FF609
// yarn deploy:matic_test:GreenBTC2I
// call setGreenBTCGift

// 2024/06/15: Call setGreenBTCGift (Amoy mainnet): 0x7670fE3CD59a43082214d070150Fa31D2054cB7a
// yarn deploy:matic_test:GreenBTC2I
// call setGreenBTCGift

// 2024/06/15: Call setGreenBTCGift (Amoy mainnet): 0x7670fE3CD59a43082214d070150Fa31D2054cB7a
// yarn deploy:matic_test:GreenBTC2I
// call approveGift (AKRE, USDT), openActionGifts(1)

// 2024/06/15A: Call setGreenBTCGift (Amoy mainnet): 0x488D299fd805b4e8BBBE819986E85c22F8513A0E
// yarn deploy:matic_test:GreenBTC2I
// call: setGreenBTCGift,  approveGift (AKRE, USDT)

// 2024/06/15B: Call setGreenBTCGift (Amoy mainnet): 0x488D299fd805b4e8BBBE819986E85c22F8513A0E
// yarn deploy:matic_test:GreenBTC2I
// call: registerDomain

// 2024/06/15C: Call setGreenBTCGift (Amoy mainnet): 0x488D299fd805b4e8BBBE819986E85c22F8513A0E
// yarn deploy:matic_test:GreenBTC2I
// call: openActionGifts（1）


func.tags = ["GreenBTC2I"];

export default func;

