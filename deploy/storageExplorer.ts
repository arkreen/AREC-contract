import { ethers } from "hardhat";
import { utils } from 'ethers'

async function main() {
//const contract_address = '0x1F742C5f32C071A9925431cABb324352C6e99953'           //add contract address here, pre-pro
  const contract_address = '0x682e01f8ecc0524085f51cc7dfb54fdb8729ac22'           //add contract address here, dev env
  
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
