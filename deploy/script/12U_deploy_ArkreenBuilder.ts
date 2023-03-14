import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { HashKeyESGBTC__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  
  if(hre.network.name === 'matic_test') {
    const ESG_PROXY_ADDRESS = "0xA05A9677a9216401CF6800d28005b227F7A3cFae"          // ArkreenBuilder
//  const NEW_IMPLEMENTATION = "0x2D597ba4358638fFED7918994AaC12c535A93F89"         // 2023/02/25: Initial version
    const NEW_IMPLEMENTATION = "0x2D597ba4358638fFED7918994AaC12c535A93F89"         // 2023/02/25: Initial version


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


