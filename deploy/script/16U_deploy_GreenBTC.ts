import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { GreenBTC__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  
  if(hre.network.name === 'matic_test') {
    const GREENBTC_PROXY_ADDRESS  = "0x80218fCa50363E3B31A93bB29bEe7ABafc157137"     // 2023/10/24: Green BTC proxy
    const NEW_IMPLEMENTATION = "0x9642086fF6748329b0e08583E703E98499498EE2"          // 2023/10/24: Upgrade URI code

    console.log("Updating GreenBTC: ", GREENBTC_PROXY_ADDRESS);  

    const [deployer] = await ethers.getSigners();
    const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_PROXY_ADDRESS, deployer);
    const updateTx = await GreenBTCFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("GreenBTC: ", hre.network.name, GreenBTCFactory.address, NEW_IMPLEMENTATION);
 } 
};

// 2023/10/24: Test Image 
// yarn deploy:matic_test:GreenBTCU

export default func;
func.tags = ["GreenBTCU"];

