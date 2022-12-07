import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRegistery__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts } = hre;
    const { deployerAddress } = await getNamedAccounts();

    const ArkreenRegistery_address    = '0x3E8A27dA0BF241f588141659cBb6Bd39717527F1'
    const ArkreenMiner_address        = '0xAc4da3681e51278f82288617c7185a7a119E5b7B'
    const ArkreenRECIssuance_address  = '0x45D0c0E2480212A60F1a9f2A820F1d7d6472CA6B'
    const ArkreenRECToken_address     = '0x815bFE3aaCF765c9E0A4DdEb98Ad710a4Fb860d3'
    const ArkreenRECBadge_address     = '0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337'

    const Issuer_address              = '0xec9254677d252df0dCaEb067dFC8b4ea5F6edAfC'
    const Issuer_name                 = 'Arkreen DAO REC Issuer'

    console.log("Initialize ArkreenRegistery: ", CONTRACTS.gRegistry, deployerAddress);  

    if(hre.network.name === 'matic') {
        const [deployer] = await ethers.getSigners();
        const ArkreenRegisteryFactory = ArkreenRegistery__factory.connect(ArkreenRegistery_address, deployer);

        const updateTxIssuance = await ArkreenRegisteryFactory.setRECIssuance(ArkreenRECIssuance_address)
        await updateTxIssuance.wait()
        console.log("ArkreenRECIssuance Initialized: %s: ", hre.network.name, ArkreenRECIssuance_address);

        const updateTxMiner = await ArkreenRegisteryFactory.setArkreenMiner(ArkreenMiner_address)
        await updateTxMiner.wait()
        console.log("ArkreenMiner Initialized: %s: ", hre.network.name, ArkreenMiner_address);        

        const updateTxBadge = await ArkreenRegisteryFactory.setArkreenRetirement(ArkreenRECBadge_address)
        await updateTxBadge.wait()
        console.log("updateTxBadge Initialized: %s: ", hre.network.name, ArkreenRECBadge_address);        

        const updateTxAddRECIssuer = await ArkreenRegisteryFactory.addRECIssuer(Issuer_address, ArkreenRECToken_address, Issuer_name)
        await updateTxAddRECIssuer.wait()
        console.log("AddRECIssuer Initialized: %s: ", hre.network.name, Issuer_address, ArkreenRECToken_address, Issuer_name);        

        console.log("ArkreenRegistery Initialized to %s: ", hre.network.name, ArkreenRegisteryFactory.address);
    } 
};

func.tags = ["gRegistryI"];

export default func;
