import { ethers } from "hardhat";
import { utils } from 'ethers'
import { BigNumber } from "ethers";
import { MulticallS__factory } from "../typechain";
import { DateTime } from 'luxon'

async function main() {
  //const GREENBTC_ADDRESS = '0xDf51F3DCD849f116948A5B23760B1ca0B5425BdE'           // Green BTC on Polygon
  const MULTICALLS_ADDRESS = '0x6A4341FfE4A4b5bd71da3C8D5052b03bf1B3f0c0'

  const [deployer] = await ethers.getSigners();

  const multicallS = MulticallS__factory.connect(MULTICALLS_ADDRESS as string, deployer);

  let openCount = 0
        
    for(let index = 0 ; index < 256; index ++) {
      console.log("PPPPPPPPPPPPPP", index, DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss"))
      const emptyList = await multicallS.listEmptyGreenBTC(index*512, 10)
      openCount += emptyList.length
      console.log("QQQQQQQQQQQQQ", emptyList)
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// yarn GreenBTCTList:matic