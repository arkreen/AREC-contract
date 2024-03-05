import { ethers } from "hardhat";
import { utils } from 'ethers'
import { BigNumber } from "ethers";

async function main() {
  const contract_address = '0xDf51F3DCD849f116948A5B23760B1ca0B5425BdE'           // Green BTC on Polygon


  for(let index = 0 ; index < 20; index ++) {
    let itemData = await ethers.provider.getStorageAt(contract_address, 350 + index) 
    console.log("555555555555555:", itemData)
  }

  
/*  
  //const slot = 363                                                              // add the storage slot of contract you want to access
  const whiteListBatchIndexHead = await ethers.provider.getStorageAt(contract_address, 363) 
  console.log("whiteListBatchIndexHead :", whiteListBatchIndexHead)

  const whiteListBatchIndexTail  = await ethers.provider.getStorageAt(contract_address, 364) 
  console.log("whiteListBatchIndexTail :", whiteListBatchIndexTail )

  const whiteListBatchPoolIndexHeadKey = 0
  const whiteListBatchPoolIndexHeadSlot = utils.keccak256(
    utils.defaultAbiCoder.encode(
      ['uint256', 'uint256'],
      [whiteListBatchPoolIndexHeadKey , 365]                // index
    )
  )

  const whiteListBatchPoolIndexTailSlot = utils.keccak256(
    utils.defaultAbiCoder.encode(
      ['uint256', 'uint256'],
      [whiteListBatchPoolIndexHeadKey , 366]
    )
  )

  const whiteListBatchPoolIndexHead  = await ethers.provider.getStorageAt(contract_address, whiteListBatchPoolIndexHeadSlot) 
  console.log("whiteListBatchPoolIndexHead :", whiteListBatchPoolIndexHead )

  const whiteListBatchPoolIndexTail  = await ethers.provider.getStorageAt(contract_address, whiteListBatchPoolIndexTailSlot) 
  console.log("whiteListBatchPoolIndexTail :", whiteListBatchPoolIndexTail  )

  for(let index = 455; index < 455+300+10; index++) {
    const whiteListMinerBatchSlot = utils.keccak256(
        utils.defaultAbiCoder.encode(['uint256', 'uint256'],  [index , 362])
      )
    const whiteListMinerBatch  = await ethers.provider.getStorageAt(contract_address, whiteListMinerBatchSlot) 
    console.log("whiteListMinerBatch in index:", index, whiteListMinerBatch  )
  }
  */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// yarn storageExplorerGreenBTC:matic