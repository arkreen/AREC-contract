import { ethers } from "hardhat";
import * as fs from "fs"
import { GreenBTC__factory, ArkreenRECToken__factory } from "../typechain";
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
  const USDC = ArkreenRECToken__factory.connect(USDC_ADDRESS, owner);   

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
       
  console.log("8888888888888888888")             
  
  //await USDC.approve(greenBTC.address, constants.MaxUint256)

  console.log("9999999999999999999999999")   
  
  let tx
  try {
    
/*    
    greenBTCInfo.height = BigNumber.from(10345)
    greenBTCInfo.ARTCount = expandTo6Decimals(100)   
    amountPay = expandTo6Decimals(100).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("0000000000000", tx)
                                
    greenBTCInfo.height = BigNumber.from(11345)
    greenBTCInfo.ARTCount = expandTo6Decimals(110)   
    amountPay = expandTo6Decimals(110).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("111111111111111111", tx)

    greenBTCInfo.height = BigNumber.from(12345)
    greenBTCInfo.ARTCount = expandTo6Decimals(120)   
    amountPay = expandTo6Decimals(120).mul(200).div(expandTo6Decimals(1000))

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("222222222222222222", tx)

    greenBTCInfo.height = BigNumber.from(13345)
    greenBTCInfo.ARTCount = expandTo6Decimals(130)    
    amountPay = expandTo6Decimals(130).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("33333333333333333", tx)

    greenBTCInfo.height = BigNumber.from(14345)
    greenBTCInfo.ARTCount = expandTo6Decimals(140)   
    amountPay = expandTo6Decimals(140).mul(200).div(expandTo6Decimals(1000)) 
 
    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("4444444444444444444", tx)
    
    greenBTCInfo.height = BigNumber.from(15345)
    greenBTCInfo.ARTCount = expandTo6Decimals(150)  
    amountPay = expandTo6Decimals(150).mul(200).div(expandTo6Decimals(1000)) 
  
    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("55555555555555555555555", tx)    

    greenBTCInfo.height = BigNumber.from(16345)
    greenBTCInfo.ARTCount = expandTo6Decimals(160)
    amountPay = expandTo6Decimals(160).mul(200).div(expandTo6Decimals(1000)) 
    
    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("66666666666666666666", tx)    

    greenBTCInfo.height = BigNumber.from(17345)
    greenBTCInfo.ARTCount = expandTo6Decimals(170)    
    amountPay = expandTo6Decimals(170).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("77777777777777777777777", tx)    

    greenBTCInfo.height = BigNumber.from(18345)
    greenBTCInfo.ARTCount = expandTo6Decimals(180)  
    amountPay = expandTo6Decimals(180).mul(200).div(expandTo6Decimals(1000)) 
  
    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("88888888888888888888888888", tx)    

    greenBTCInfo.height = BigNumber.from(19345)
    greenBTCInfo.ARTCount = expandTo6Decimals(190)
    amountPay = expandTo6Decimals(190).mul(200).div(expandTo6Decimals(1000)) 
 
    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("99999999999999999999999999", tx)    

    greenBTCInfo.height = BigNumber.from(20345)
    greenBTCInfo.ARTCount = expandTo6Decimals(200)    
    amountPay = expandTo6Decimals(200).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAA", tx)    

    greenBTCInfo.height = BigNumber.from(21345)
    greenBTCInfo.ARTCount = expandTo6Decimals(210)    
    amountPay = expandTo6Decimals(210).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBB", tx)    

    greenBTCInfo.height = BigNumber.from(22345)
    greenBTCInfo.ARTCount = expandTo6Decimals(220)    
    amountPay = expandTo6Decimals(220).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", tx)    

    greenBTCInfo.height = BigNumber.from(23345)
    greenBTCInfo.ARTCount = expandTo6Decimals(230)    
    amountPay = expandTo6Decimals(230).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDD", tx)    

    greenBTCInfo.height = BigNumber.from(24345)
    greenBTCInfo.ARTCount = expandTo6Decimals(240) 
    amountPay = expandTo6Decimals(240).mul(200).div(expandTo6Decimals(1000)) 
   
    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE", tx)    


    greenBTCInfo.height = BigNumber.from(25345)
    greenBTCInfo.ARTCount = expandTo6Decimals(250)    
    amountPay = expandTo6Decimals(250).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("FFFFFFFFFFFFFFFFFFFFFFFFF", tx)    
*/

    greenBTCInfo.height = BigNumber.from(26345)
    greenBTCInfo.ARTCount = expandTo6Decimals(260)    
    amountPay = expandTo6Decimals(260).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("GGGGGGGGGGGGGGGGGGGGGGG", tx)    

    greenBTCInfo.height = BigNumber.from(27345)
    greenBTCInfo.ARTCount = expandTo6Decimals(270)    
    amountPay = expandTo6Decimals(270).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("HHHHHHHHHHHHHHHHHHHHHH", tx)    
    
    greenBTCInfo.height = BigNumber.from(28345)
    greenBTCInfo.ARTCount = expandTo6Decimals(280)    
    amountPay = expandTo6Decimals(280).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("IIIIIIIIIIIIIIIIIIIIIIII", tx)  
    
    greenBTCInfo.height = BigNumber.from(29345)
    greenBTCInfo.ARTCount = expandTo6Decimals(290)    
    amountPay = expandTo6Decimals(290).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("JJJJJJJJJJJJJJJJJJJJJJJJJ", tx)  
    
    greenBTCInfo.height = BigNumber.from(30345)
    greenBTCInfo.ARTCount = expandTo6Decimals(300)    
    amountPay = expandTo6Decimals(300).mul(200).div(expandTo6Decimals(1000)) 

    tx  = await greenBTC.authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                {token: USDC_ADDRESS, amount: amountPay}, constants.MaxUint256)   
    console.log("KKKKKKKKKKKKKKKKKKKKKKKKKK", tx)  

/*
    tx  = await greenBTC.openBox(10345)   
    tx  = await greenBTC.openBox(11345)   
    tx  = await greenBTC.openBox(12345)   
    tx  = await greenBTC.openBox(13345)   
    tx  = await greenBTC.openBox(14345)   
    tx  = await greenBTC.openBox(15345)   
    tx  = await greenBTC.openBox(16345)   
    tx  = await greenBTC.openBox(17345)   
    tx  = await greenBTC.openBox(18345)   
    tx  = await greenBTC.openBox(19345)   
    tx  = await greenBTC.openBox(20345)   
    tx  = await greenBTC.openBox(21345)   
    tx  = await greenBTC.openBox(22345)   
    tx  = await greenBTC.openBox(23345)   
    tx  = await greenBTC.openBox(24345)   
    tx  = await greenBTC.openBox(25345)   
*/

//  tx  = await greenBTC.revealBoxes()

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


// yarn GreenBTCTest
