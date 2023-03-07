import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { HashKeyESGBTC__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  
  if(hre.network.name === 'matic_test') {
    const ESG_PROXY_ADDRESS = "0xDe8e59dAB27EB97b2267d4230f8FE713A637e03c"          // HashKet ESG contract HskBTC
//  const NEW_IMPLEMENTATION = "0xaB3B018Eed1216d27739CFCC8501Bb36a7A18074"         // 2023/03/05: Add getAllBrickIDs
    const NEW_IMPLEMENTATION = "0x084726129D09976D236642CdCE648039BaE2b072"         // 2023/03/05: Fix a small bug
   
    console.log("Updating HashKey ESG BTC: ", ESG_PROXY_ADDRESS);  
    const [deployer] = await ethers.getSigners();
    const HashKeyESGBTCFactory = HashKeyESGBTC__factory.connect(ESG_PROXY_ADDRESS, deployer);
    const updateTx = await HashKeyESGBTCFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("HashKey ESG BTC Updated: ", hre.network.name, HashKeyESGBTCFactory.address, NEW_IMPLEMENTATION);
 } 
};

export default func;
func.tags = ["HskBTCU"];


