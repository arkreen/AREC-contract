import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECIssuanceExt__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();
    console.log("Updating ArkreenRECIssuance: ", CONTRACTS.RECIssuance, deployer.address);  

//    Cannot be verified in this way    
//    const ArkreenRECIssuanceFactory = await ethers.getContractFactory("ArkreenRECIssuance");
//    const ArkreenRECIssuance_Upgrade = await ArkreenRECIssuanceFactory.deploy();
//    await ArkreenRECIssuance_Upgrade.deployed();

    if(hre.network.name === 'matic_test') {
        const REC_ISSUANCE_ADDRESS = "0x95f56340889642a41b913c32d160d2863536e073"       // Need to check  // Simu mode
        const MVP_ADDRESS = "0x8d832f73D678cFd2dA04401b18973Ed146Db1ABA"                // (2023/2/26): Simu mode, MVP address, account 6
        const MVP_ADDRESS1 = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"               // (2023/2/27): Simu mode, MVP address, account 1
        const MVP_ADDRESS2 = "0xB53B96e1eF29cB14313c18Fa6374AB87df59BcD9"               // (2023/2/27): Simu mode, MVP address, account 2
        const MVP_ADDRESS3 = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"               // (2023/2/27): Simu mode, MVP address, account 3

        const [deployer] = await ethers.getSigners();
        const ArkreenRECIssuanceExtFactory = ArkreenRECIssuanceExt__factory.connect(REC_ISSUANCE_ADDRESS, deployer);

        // function manageMVPAddress(bool op, address[] calldata listMVP) 
        const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_ADDRESS1, MVP_ADDRESS2, MVP_ADDRESS3])
        await updateTx.wait()

        console.log("callData, update", updateTx)
        console.log("ArkreenRECIssuance: set MVP address to %s: ", hre.network.name, ArkreenRECIssuanceExtFactory.address, MVP_ADDRESS);
    } 

    if(hre.network.name === 'matic') {
      const REC_ISSUANCE_ADDRESS = "0x45D0c0E2480212A60F1a9f2A820F1d7d6472CA6B"       // Need to check
      const MVP_ADDRESS = ""             

      const [deployer] = await ethers.getSigners();
      const ArkreenRECIssuanceExtFactory = ArkreenRECIssuanceExt__factory.connect(REC_ISSUANCE_ADDRESS, deployer);

      // function manageMVPAddress(bool op, address[] calldata listMVP) 
      const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_ADDRESS])
      await updateTx.wait()

      console.log("callData, update", updateTx)
      console.log("ArkreenRECIssuance Updated to %s: ", hre.network.name, ArkreenRECIssuanceExtFactory.address, MVP_ADDRESS);
  } 
};

func.tags = ["RECIssueI"];

export default func;
