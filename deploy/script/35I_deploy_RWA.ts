import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";
import { RWAsset__factory } from "../../typechain";
import { ethers } from "hardhat";

import { expandTo18Decimals } from '../../test/utils/utilities'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(750_000_000_000)

    let rwaAssetAddress
    let rwaAssetProAddress
    let usdtAddress
    let usdcAddress

    if(hre.network.name === 'matic_test')  {
      // 2024/12/23: Amoy testnet                        
      rwaAssetAddress   = "0xa582255dDa401f5fCE72b303ABcBc314E11170a7"        // 2024/12/23
      rwaAssetProAddress = "0x23810C3553dF852242D415f89a512A6015b3EA89"
      usdtAddress = "0xc7767ae828e4830e2f800981e573f333d1e492b5"
      usdcAddress = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"

      const assetType = {
        typeAsset:            1,
        tenure:               12,
        investQuota:          800,
        valuePerInvest:       1_000_000,
        amountRepayMonthly:   150_000_000,
        amountYieldPerInvest: 80_000,
        amountDeposit:        1_500_000,
        investTokenType:      1,
        maxInvestOverdue:     15,
        minInvestExit:        7,
        interestId:           1,
        paramsClearance:      20 + (20<<8), 
        timesSlashTop:        20 + (10<<8)
      }

      const rwaAssetContract = RWAsset__factory.connect(rwaAssetAddress, deployer);

/*      
      // 2024/12/23: Amoy testnet
      const setRWAProTx =  await rwaAssetContract.setRWAPro(rwaAssetProAddress, {gasPrice: defaultGasPrice})
      await setRWAProTx.wait()                
*/

      const addNewInvestTokenTx = await rwaAssetContract.addNewInvestToken(1, [usdtAddress, usdcAddress])
      await addNewInvestTokenTx.wait()                

      const addNewAssetTypeTx = await rwaAssetContract.addNewAssetType(assetType)
      await addNewAssetTypeTx.wait()                

      console.log("rwaAssetContract setRWAPro", rwaAssetContract.address, addNewInvestTokenTx, addNewAssetTypeTx)
      
    } else if(hre.network.name === 'matic')  {
      rwaAssetAddress   = "0xa582255dDa401f5fCE72b303ABcBc314E11170a7"        // 2024/12/23
      rwaAssetProAddress = "0x23810C3553dF852242D415f89a512A6015b3EA89"

      const rwaAssetContract = RWAsset__factory.connect(rwaAssetAddress, deployer);
    
      // 2024/12/23: Polygon mainnet
      const setRWAProTx =  await rwaAssetContract.setRWAPro(rwaAssetProAddress, {gasPrice: defaultGasPrice})
      await setRWAProTx.wait()                

      console.log("rwaAssetContract changePromotionConfig", rwaAssetContract.address, setRWAProTx)
    } 
};

// 2024/12/23: Call setRWAPro                 
// yarn deploy:matic_test:RWAssetI              : Amoy testnet

func.tags = ["RWAssetI"];

export default func;
