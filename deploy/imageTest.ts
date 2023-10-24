import { ethers } from "hardhat";
import * as fs from "fs"
import { GreenBTC__factory } from "../typechain";
import { constants, BigNumber, utils } from 'ethers'

import { getGreenBitcoinDigest  } from "../test/utils/utilities";
import { ecsign } from 'ethereumjs-util'

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function expandTo6Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(6))
}

async function main() {

  const [owner, ConfirmAccount] = await ethers.getSigners();
  console.log('Account',  owner.address, ConfirmAccount.address)

  const GREEN_BTC_ADDRESS = "0x80218fCa50363E3B31A93bB29bEe7ABafc157137"       // Need to check
  const greenBTC = GreenBTC__factory.connect(GREEN_BTC_ADDRESS, owner);   

  const USDC_ADDRESS = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"           // Need to check
  const privateKeyRegister = process.env.REGISTER_TEST_PRIVATE_KEY as string

  // Normal: authMintGreenBTCWithApprove   
  let greenBTCInfo =  {
    height: BigNumber.from(10345),
    ARTCount: expandTo6Decimals(100),  // 0.1 HART
    beneficiary: owner.address,
    greenType: 1,
    blockTime: 'Apr 26, 2009 10:25 PM UTC',
    energyStr: '0.123 MWh'
  }

  console.log("111111111111111111111")                          

  const badgeInfo =  {
    beneficiary:    owner.address,
    offsetEntityID: 'Owner1',
    beneficiaryID:  'Tester',
    offsetMessage:  "Just Testing"
  }    

  const approve = { 
    height:       greenBTCInfo.height,
    energyStr:    greenBTCInfo.energyStr,
    artCount:     greenBTCInfo.ARTCount,
    blockTime:    greenBTCInfo.blockTime,
    beneficiary:  greenBTCInfo.beneficiary,
    greenType:    greenBTCInfo.greenType
  }

  console.log("222222222222222222222222222", greenBTC.address, approve )   

  const register_digest =  utils.keccak256(
    utils.defaultAbiCoder.encode(
      [ 'uint256', 'string', 'uint256', 'string', 'address', 'uint8'],
      [ approve.height, approve.energyStr, approve.artCount, approve.blockTime, approve.beneficiary, approve.greenType]
    )
  )
  console.log("333333333333333333333")   

  let amountPay = expandTo6Decimals(100).mul(200).div(expandTo6Decimals(1000))

//  const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
//                          Buffer.from(privateKeyRegister.slice(2), 'hex'))   
                          
  const {v,r,s} = {v:1, r:register_digest, s:register_digest}       // Fake                    
       
  console.log("9999999999999999999999999")                          
  try {
    const tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
            {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    
    console.log("AAAAAAAAAAAAA", tx)

  } catch (error) {
    console.log("Error happened:", error, (new Date()).toLocaleString())
  }


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
