import { ethers } from "hardhat";
import { utils } from 'ethers'
import { BigNumber } from "ethers";

async function main() {
  const contract_address = '0xDf51F3DCD849f116948A5B23760B1ca0B5425BdE'        // Green BTC on Polygon
  // const contract_address = '0x1e5132495cdaBac628aB9F5c306722e33f69aa24'           // Badge on Polygon
  

  for(let index = 0 ; index < 30; index ++) {
    let itemData = await ethers.provider.getStorageAt(contract_address, 350 + index) 
    console.log("555555555555555:", itemData)
  }

  for(let index = 0; index < 10; index++) {
    const dataGBTCSlot = utils.keccak256(
        utils.defaultAbiCoder.encode(['uint256', 'uint256'],  [index+114474 , 361])
      )
    const greenBTCInfo0  = await ethers.provider.getStorageAt(contract_address, dataGBTCSlot) 
    const greenBTCInfo1  = await ethers.provider.getStorageAt(contract_address, BigNumber.from(dataGBTCSlot).add(1)) 
    const greenBTCInfo2  = await ethers.provider.getStorageAt(contract_address, BigNumber.from(dataGBTCSlot).add(2))
    const greenBTCInfo3  = await ethers.provider.getStorageAt(contract_address, BigNumber.from(dataGBTCSlot).add(3))
    const greenBTCInfo4  = await ethers.provider.getStorageAt(contract_address, BigNumber.from(dataGBTCSlot).add(4))
    const greenBTCInfo5  = await ethers.provider.getStorageAt(contract_address, BigNumber.from(dataGBTCSlot).add(5))
    const greenBTCInfo6  = await ethers.provider.getStorageAt(contract_address, BigNumber.from(dataGBTCSlot).add(6))
    const greenBTCInfo7  = await ethers.provider.getStorageAt(contract_address, BigNumber.from(dataGBTCSlot).add(7))
    const greenBTCInfo8  = await ethers.provider.getStorageAt(contract_address, BigNumber.from(dataGBTCSlot).add(8))

    console.log("\r")
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo0)
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo1)
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo2)
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo3)
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo4)
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo5)
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo6)
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo7)
    console.log("whiteListMinerBatch in index:", index, greenBTCInfo8)
  }
}

/*
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
555555555555555: 0x94e263363c89b0abe215976f022425d5fcf36ce18819e51125e9fe1fde613c8b: 351
555555555555555: 0x000000000000000000000000bebe239ca18baca579f5b82c1c290fc951fb954c
555555555555555: 0x0000000000000000000000000de4fb23694c1532815ad90fd1689c7234242fe3
555555555555555: 0x00000000000000000000000081f0b102a4d21b1bdac5c0c4cb350d0c30388892
555555555555555: 0x0000000000000000000000007073ea8c9b0612f3c3fe604425e2af7954c4c92e
555555555555555: 0x0000000000000000000000000d7899f2d36344ed21829d4ebc49cc0d335b4a06
555555555555555: 0x0000000000000000000000000d500b1d8e8ef31e21c99d1db9a6444d3adf1270: 357
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000002114
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000：360: dataGBTC
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000005
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
555555555555555: 0x0000000000000000000000000000000000000000000000000000000000000000
*/

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// yarn storageExplorerGreenBTC:matic