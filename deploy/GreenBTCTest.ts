import { ethers } from "hardhat";
import { utils } from 'ethers'
import { BigNumber } from "ethers";
import { GreenBTC__factory } from "../typechain";

import OverTimeInfo from "./OverTimeInfo.json";

async function main() {
  const GREENBTC_ADDRESS = '0xDf51F3DCD849f116948A5B23760B1ca0B5425BdE'           // Green BTC on Polygon

  const [deployer] = await ethers.getSigners();

  const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_ADDRESS as string, deployer);

  const allOvertimeBlocks =  OverTimeInfo.overTimeList

  console.log('QQQQQQQQQQQ', allOvertimeBlocks.length)

  let allDataNFT = new Array(allOvertimeBlocks.length) 

  let allDataNFTRevealed = new Array(0)
  let allDataNFTOpened = new Array(0)

  let revealCount = 0
  let openCount = 0
  
  for(let index = 0 ; index < allOvertimeBlocks.length; index ++) {
    const dataNFT = await GreenBTCFactory.dataNFT(OverTimeInfo.overTimeList[index][0])
    allDataNFT[index] = dataNFT

    if (dataNFT.reveal) {
      allDataNFTRevealed.push(dataNFT)
      revealCount++
      console.log("555555555555555:", index, OverTimeInfo.overTimeList[index][0])
    } else if (dataNFT.open) {
      allDataNFTOpened.push(dataNFT)
      openCount++
      console.log("AAAAAAAAAAAA:", index, OverTimeInfo.overTimeList[index][0])
    }
  }
  console.log('1111111111', revealCount, openCount)
  console.log('222222222222', allDataNFTRevealed)
  console.log('33333333333333', allDataNFTOpened)
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// yarn GreenBTCTest:matic