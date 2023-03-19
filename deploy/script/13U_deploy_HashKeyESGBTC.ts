import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { HashKeyESGBTC__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  
  if(hre.network.name === 'matic_test') {
//  const ESG_PROXY_ADDRESS = "0xDe8e59dAB27EB97b2267d4230f8FE713A637e03c"          // HashKet ESG contract HskBTC; Version 1
//  const NEW_IMPLEMENTATION = "0xaB3B018Eed1216d27739CFCC8501Bb36a7A18074"         // 2023/03/05: Add getAllBrickIDs
//  const NEW_IMPLEMENTATION = "0x084726129D09976D236642CdCE648039BaE2b072"         // 2023/03/05: Fix a small bug
//  const NEW_IMPLEMENTATION = "0xd5F14899428e135B1684ba653487795eF39242B9"         // 2023/03/07: Return owners in getAllBrickIDs

    const ESG_PROXY_ADDRESS = "0x785dca2ca9a51513da1fef9f70e6b6ab02896f67"          // HashKet ESG contract HskBTC; Version 2, support RECBank 
//  const NEW_IMPLEMENTATION = "0xF9Be1Dc7Be9659A4EB47D26581a864fCef10631E"         // 2023/03/18: add API getMVPBlocks, and the flag in brickIds to indicate MVP
    const NEW_IMPLEMENTATION = "0x7D427484834e9d89F5777EBef16f5f2CF83E9093"         // 2023/03/18: Fix the compatibility problem in test
      
    console.log("Updating HashKey ESG BTC: ", ESG_PROXY_ADDRESS);  
    const [deployer] = await ethers.getSigners();
    const HashKeyESGBTCFactory = HashKeyESGBTC__factory.connect(ESG_PROXY_ADDRESS, deployer);
//  const updateTx = await HashKeyESGBTCFactory.upgradeTo(NEW_IMPLEMENTATION)
//  await updateTx.wait()

    const callData = HashKeyESGBTCFactory.interface.encodeFunctionData("postUpdate")
    const updateTx = await HashKeyESGBTCFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("HashKey ESG BTC Updated: ", hre.network.name, HashKeyESGBTCFactory.address, NEW_IMPLEMENTATION);
 } 
};

export default func;
func.tags = ["HskBTCU"];


