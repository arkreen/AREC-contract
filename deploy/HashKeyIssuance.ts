import { ethers } from "hardhat";
import * as fs from "fs"
import { ArkreenRECIssuance__factory } from "../typechain";
import { RECDataStructOutput } from "../typechain/contracts/ArkreenRECIssuance";

export enum REC_STATUS {
  Pending,            // 0
  Rejected,           // 1
  Cancelled,          // 2
  Certified,          // 3
  Retired,            // 4
  Liquidized          // 5
}

interface confirmInfo {
  counter:    string
  SerialNo:   string
}

function getConfirmInfo(): confirmInfo {
  const counterFile = './deploy/confirmCounter.txt'
  const confirmInfoStr = fs.readFileSync(counterFile,'ascii')
  const confirmInfoJson = JSON.parse(confirmInfoStr)
  return confirmInfoJson
}

function setConfirmInfo(confirmInfoJson: confirmInfo) {
  const counterFile = './deploy/confirmCounter.txt'
  fs.writeFileSync(counterFile, JSON.stringify(confirmInfoJson))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {

  const [owner, ConfirmAccount] = await ethers.getSigners();
  console.log('Account',  owner.address, ConfirmAccount.address)

  const ISSUANCE_ADDRESS = "0x95f56340889642a41b913c32d160d2863536e073"       // Need to check
  const arkreenRECIssuance = ArkreenRECIssuance__factory.connect(ISSUANCE_ADDRESS, ConfirmAccount);

  // Get latest AREC issuance status
  const totalARECNumber =  await arkreenRECIssuance.totalSupply()
  const ARECNftInfo: RECDataStructOutput = await arkreenRECIssuance.getRECData(totalARECNumber)

  let confirmInfoJson: confirmInfo = {  counter: totalARECNumber.toString().padStart(4,'0'),
                                        SerialNo: ARECNftInfo.serialNumber}
  setConfirmInfo(confirmInfoJson)                                        

  console.log("Current Confirmation:", confirmInfoJson, (new Date()).toLocaleString())
  while(true) {
    const totalARECNumber =  await arkreenRECIssuance.totalSupply()
    const startTokenID = Number(confirmInfoJson.counter)
    let NewSerialNo = Number(confirmInfoJson.SerialNo)

    console.log("Current Confirmation:", confirmInfoJson, (new Date()).toLocaleString())
    for(let index=(startTokenID+1); index<totalARECNumber.toNumber()+1; index++) {      // Id start from 1
      try {
        const ARECNftInfo: RECDataStructOutput = await arkreenRECIssuance.getRECData(index)
        
        if(ARECNftInfo.status == REC_STATUS.Pending) {
          NewSerialNo = NewSerialNo +1
          const NewSerialNoString = NewSerialNo.toString().padStart(8,'0')
          await arkreenRECIssuance.certifyRECRequest(index, NewSerialNoString)

          confirmInfoJson.counter = index.toString().padStart(4,'0')
          confirmInfoJson.SerialNo = NewSerialNoString

          setConfirmInfo(confirmInfoJson)
          console.log("Updated Confirmation:", confirmInfoJson, (new Date()).toLocaleString())
        }
      }
      catch (error) {
        console.log("Error happened:", error, (new Date()).toLocaleString())
        break
      }
    }
    await sleep(60*1000)  // sleep 1 minute
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
