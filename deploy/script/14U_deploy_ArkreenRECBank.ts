import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenRECBank__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  
  if(hre.network.name === 'matic_test') {
    // const RECBANK_PROXY_ADDRESS   = "0x7ee6D2A14d6Db71339a010d44793B27895B36d50" // 2023/3/14 Arkreen REC bank proxy
    const RECBANK_PROXY_ADDRESS   = "0xf9aAcFf1B292F82b60662e47610C570ef58d3c70"    // 2024/05/20 Amoy: Arkreen REC bank proxy

    // const NEW_IMPLEMENTATION = "0xCdacE7DB767e77BD938e488925B6b00f98D4063C"      // 2023/3/14 Arkreen REC Bank implementation
    // const NEW_IMPLEMENTATION = "0x84AEAe330517A89Ab74f5eD0f805522634dF8Df6"      // 2023/07/26: Upgrade to add new event
    const NEW_IMPLEMENTATION = "0x16BCB4B078AcDF8b5fAEd988FEcC61FB0D84d352"         // 2024/05/20 Amoy: Upgrade to support return value while buying ART

    console.log("Updating Arkreen REC Bank: ", RECBANK_PROXY_ADDRESS);  

    const [deployer] = await ethers.getSigners();
    const ArkreenBankFactory = ArkreenRECBank__factory.connect(RECBANK_PROXY_ADDRESS, deployer);
    const updateTx = await ArkreenBankFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    // const ARKREEN_REC_BANK = "0x7ee6D2A14d6Db71339a010d44793B27895B36d50"
    // const callData = ArkreenBankFactory.interface.encodeFunctionData("postUpdate", [ARKREEN_REC_BANK])
    // const updateTx = await ArkreenBankFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    // await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("Arkreen REC Bank: ", hre.network.name, ArkreenBankFactory.address, NEW_IMPLEMENTATION);
  } 
  else if(hre.network.name === 'matic') {
    const RECBANK_PROXY_ADDRESS   = "0xab65900A52f1DcB722CaB2e5342bB6b128630A28"    // 2023/04/05: Arkreen REC bank proxy
    // const NEW_IMPLEMENTATION = "0xF845c843DaEa0cE08d2184CC1eDfe2b998B2d565"      // 2024/01/11: Upgrade to add new event
    // const NEW_IMPLEMENTATION = "0xED673Af2CD4eAEb2687DcB34e013335437463A31"      // 2024/04/03: Fix the withdraw bug
    const NEW_IMPLEMENTATION = "0x5DbF34752CeBAeA2386337f5ea23c1dCaD48EE6A"         // 2024/04/03: support return value while buying ART

    console.log("Updating Arkreen REC Bank: ", RECBANK_PROXY_ADDRESS);  

    const [deployer] = await ethers.getSigners();
    const ArkreenBankFactory = ArkreenRECBank__factory.connect(RECBANK_PROXY_ADDRESS, deployer);
    const updateTx = await ArkreenBankFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("Arkreen REC Bank: ", hre.network.name, ArkreenBankFactory.address, NEW_IMPLEMENTATION);
  } 
  else if(hre.network.name === 'celo') {
    const RECBANK_PROXY_ADDRESS   = "0x815bFE3aaCF765c9E0A4DdEb98Ad710a4Fb860d3"    // 2023/11/01: Arkreen REC bank proxy
    const NEW_IMPLEMENTATION = "0x92131f116dC4653e1fCF9E3FdC543827105101fE"         // 2024/11/20: support removing ART deposit

    console.log("Updating Arkreen REC Bank: ", RECBANK_PROXY_ADDRESS);  

    const [deployer] = await ethers.getSigners();
    const ArkreenBankFactory = ArkreenRECBank__factory.connect(RECBANK_PROXY_ADDRESS, deployer);
    const updateTx = await ArkreenBankFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("Arkreen REC Bank: ", hre.network.name, ArkreenBankFactory.address, NEW_IMPLEMENTATION);
  }

};

// 2023/07/26: Upgrade to add new events for subgraph and 3rd API
// yarn deploy:matic_test:ArtBankU

// 2024/01/11: Upgrade to add new events for subgraph and 3rd API
// yarn deploy:matic:ArtBankU

// 2024/04/03: Fix the withdraw bug 
// yarn deploy:matic:ArtBankU

// 2024/05/20: Upgrade to support return value while buying ART
// yarn deploy:matic_test:ArtBankU

// 2024/09/02: Upgrade to support return value while buying ART
// yarn deploy:matic:ArtBankU

// 2024/11/20: Upgrade to support return value while buying ART
// yarn deploy:celo:ArtBankU  (0x92131f116dC4653e1fCF9E3FdC543827105101fE)


export default func;
func.tags = ["ArtBankU"];


