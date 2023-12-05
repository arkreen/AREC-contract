import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { GreenBTC__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { getChainId } = hre;

  const chainID = await getChainId()
  const defaultGasPrice = (chainID === '80001') ? BigNumber.from(6000000000) : BigNumber.from(50000000000)

  if(hre.network.name === 'matic_test') {
    const GREENBTC_PROXY_ADDRESS  = "0x770cB90378Cb59665BbF623a72b90f427701C825"     // 2023/10/24: Green BTC proxy
    // const NEW_IMPLEMENTATION = "0x17533f8C83eaFbacE7443647Ec9C2326190955Fb"       // 2023/10/24: Upgrade URI logic with open/reveal
    // const NEW_IMPLEMENTATION = "0x7dbCb85512a9889287b3fD61EDab1fA615D654b8"       // 2023/10/24: Upgrade for luckyRate updateable
    // const NEW_IMPLEMENTATION = "0x1DBB6623A6cF8b12bd1FB4A138D7FE11b1ec5f2e"       // 2023/10/25: Upgrade for luckyRate
    // const NEW_IMPLEMENTATION = "0x71CfBEAC18B738C5Cc34515C0316495A6CDf7231"       // 2023/10/25: Upgrade for changong management strategy
    // const NEW_IMPLEMENTATION = "0xc2f3A5b34D7Ed23297C57597001d82904191454D"       // 2023/10/26: Upgrade to change beneficiary to minter, greenType is used to flag ART type
    // const NEW_IMPLEMENTATION = "0x9a1FC5338303b7E675a9cFfA2050aa7300760b5F"       // 2023/10/26: Add ART type check, and check minter is not zero
    // const NEW_IMPLEMENTATION = "0x1fcF387670f4f4835029eCE4acAb5CF327BFc005"       // 2023/10/27: Change image contract, move  all svg logic to image contract
    // const NEW_IMPLEMENTATION = "0xf2F563a63ba82aF85294d8d857dF7e7A22DdaB8B"       // 2023/12/04: Add buying in batch, and buy with opening 
    const NEW_IMPLEMENTATION    = "0x5Ae000aee2BFA8CB76f655FdBCdFe3Cb0e727941"       // 2023/12/05: Upgrade for enable pay back config
        
    console.log("Updating GreenBTC: ", GREENBTC_PROXY_ADDRESS, chainID, defaultGasPrice.toString());  

    const [deployer] = await ethers.getSigners();
    const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_PROXY_ADDRESS, deployer);
    const updateTx = await GreenBTCFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("GreenBTC: ", hre.network.name, GreenBTCFactory.address, NEW_IMPLEMENTATION);
 } 

 if(hre.network.name === 'matic') {
  const GREENBTC_PROXY_ADDRESS  = "0x770cB90378Cb59665BbF623a72b90f427701C825"     // 2023/10/24: Green BTC proxy
  const NEW_IMPLEMENTATION    = "0x9a1FC5338303b7E675a9cFfA2050aa7300760b5F"       // 2023/10/26: Add ART type check, and check minter is not zero
      
  console.log("Updating GreenBTC: ", GREENBTC_PROXY_ADDRESS, chainID, defaultGasPrice.toString());  

  const [deployer] = await ethers.getSigners();
  const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_PROXY_ADDRESS, deployer);
  const updateTx = await GreenBTCFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
  await updateTx.wait()

  console.log("Update Trx:", updateTx)
  console.log("GreenBTC: ", hre.network.name, GreenBTCFactory.address, NEW_IMPLEMENTATION);
} 

};

// 2023/10/24: Upgrade to change open/reavel logic: 0x17533f8C83eaFbacE7443647Ec9C2326190955Fb
// yarn deploy:matic_test:GreenBTCU

// 2023/10/25: Upgrade to update luckyRate: 0x1DBB6623A6cF8b12bd1FB4A138D7FE11b1ec5f2e
// yarn deploy:matic_test:GreenBTCU

// 2023/10/25: Upgrade to update luckyRate: 0x71CfBEAC18B738C5Cc34515C0316495A6CDf7231
// yarn deploy:matic_test:GreenBTCU

// 2023/10/26: Upgrade to change beneficiary to minter, greenType is used to flag ART type
// yarn deploy:matic_test:GreenBTCU

// 2023/10/26:1: Add ART type check, and check minter is not zero
// yarn deploy:matic_test:GreenBTCU

// 2023/10/27: Change image contract, move  all svg logic to image contract
// yarn deploy:matic_test:GreenBTCU

// 2023/12/04: Add buying in batch, and buy with opening
// yarn deploy:matic_test:GreenBTCU

// 2023/12/05: Upgrade to enable payback config
// yarn deploy:matic_test:GreenBTCU : 0x5Ae000aee2BFA8CB76f655FdBCdFe3Cb0e727941

export default func;
func.tags = ["GreenBTCU"];


