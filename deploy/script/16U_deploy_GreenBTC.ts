import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { GreenBTC__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  
  if(hre.network.name === 'matic_test') {
    const GREENBTC_PROXY_ADDRESS  = "0x770cB90378Cb59665BbF623a72b90f427701C825"     // 2023/10/24: Green BTC proxy
    const NEW_IMPLEMENTATION = "0x17533f8C83eaFbacE7443647Ec9C2326190955Fb"          // 2023/10/24: Upgrade URI logic with open/reveal

    console.log("Updating GreenBTC: ", GREENBTC_PROXY_ADDRESS);  

    const [deployer] = await ethers.getSigners();
    const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_PROXY_ADDRESS, deployer);
    const updateTx = await GreenBTCFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("GreenBTC: ", hre.network.name, GreenBTCFactory.address, NEW_IMPLEMENTATION);
 } 
};

// 2023/07/26: Upgrade to change open/reavel logic: 0x17533f8C83eaFbacE7443647Ec9C2326190955Fb
// yarn deploy:matic_test:GreenBTCU

export default func;
func.tags = ["GreenBTCU"];


