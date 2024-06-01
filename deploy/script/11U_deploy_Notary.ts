import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ArkreenNotary__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  
  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(60_000_000_000)

  if(hre.network.name === 'matic') {
    
    const NOTARY_ADDRESS = "0x5cB755DCAAB331B73935c00403729c529ACbeDA9"          // ArkreenNotary
    const NEW_IMPLEMENTATION = "0xf4D0FA203d34E447c735A94eb6A0E622CE0E975A"      // 2024/05/30: Upgrade to remove some checking

    const [deployer] = await ethers.getSigners();

    console.log("Updating Notary: ", NOTARY_ADDRESS);  
    const NotaryFactory = ArkreenNotary__factory.connect(NOTARY_ADDRESS, deployer);
    const updateTx = await NotaryFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("Notary Updated: ", hre.network.name, NotaryFactory.address, NEW_IMPLEMENTATION);
      
  } 
};

// 2024/05/30: Remove some checking
// yarn deploy:matic:NotaryU  
// 0xf4D0FA203d34E447c735A94eb6A0E622CE0E975A

export default func;
func.tags = ["NotaryU"];