import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRegistry__factory } from "../../typechain";
import { BigNumber } from "ethers";

// Initialize 
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    console.log("Initialize ArkreenRegistry: ", CONTRACTS.gRegistry );  

    if(hre.network.name === 'matic_test') {
        const ArkreenRegistry_address    = '0x047eb5205251c5fc8a21ba8f8d46f57df62013c8'

        const idAsset =   "AREC_HSK_ESG_BTC"
        const issuer  = 	"0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"
        const tokenREC = 	"0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"
        const tokenPay = 	"0x54e1c534f59343c56549c76d1bdccc8717129832"
        const rateToIssue = BigNumber.from(100).mul(BigNumber.from(10).pow(18))
        const rateToLiquidize = 1000
        const description = 	"I-REC ERC20 token to greenize the BTC block while HashKey opening ceremony is held."                        

        const [deployer] = await ethers.getSigners();
        const ArkreenRegistryFactory = ArkreenRegistry__factory.connect(ArkreenRegistry_address, deployer);

//      function newAssetAREC(string calldata idAsset, address issuer, address tokenREC, address tokenPay,
//                              uint128 rateToIssue, uint16 rateToLiquidize, string calldata description)
        const updateTxIssuance = await ArkreenRegistryFactory.newAssetAREC(idAsset, issuer, tokenREC,
                                                        tokenPay, rateToIssue, rateToLiquidize, description)
        await updateTxIssuance.wait()
        console.log("ArkreenRegistry newAssetAREC is executed: %s: ", hre.network.name, ArkreenRegistry_address);
    }

    if(hre.network.name === 'matic') {

        const ArkreenRegistry_address    = '0x3E8A27dA0BF241f588141659cBb6Bd39717527F1'
        const ArkreenMiner_address        = '0xAc4da3681e51278f82288617c7185a7a119E5b7B'
        const ArkreenRECIssuance_address  = '0x45D0c0E2480212A60F1a9f2A820F1d7d6472CA6B'
        const ArkreenRECToken_address     = '0x815bFE3aaCF765c9E0A4DdEb98Ad710a4Fb860d3'
        const ArkreenRECBadge_address     = '0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337'
    
        const Issuer_address              = '0xec9254677d252df0dCaEb067dFC8b4ea5F6edAfC'
        const Issuer_name                 = 'Arkreen DAO REC Issuer'

        const [deployer] = await ethers.getSigners();
        const ArkreenRegistryFactory = ArkreenRegistry__factory.connect(ArkreenRegistry_address, deployer);

        const updateTxIssuance = await ArkreenRegistryFactory.setRECIssuance(ArkreenRECIssuance_address)
        await updateTxIssuance.wait()
        console.log("ArkreenRECIssuance Initialized: %s: ", hre.network.name, ArkreenRECIssuance_address);

        const updateTxMiner = await ArkreenRegistryFactory.setArkreenMiner(ArkreenMiner_address)
        await updateTxMiner.wait()
        console.log("ArkreenMiner Initialized: %s: ", hre.network.name, ArkreenMiner_address);        

        const updateTxBadge = await ArkreenRegistryFactory.setArkreenRetirement(ArkreenRECBadge_address)
        await updateTxBadge.wait()
        console.log("updateTxBadge Initialized: %s: ", hre.network.name, ArkreenRECBadge_address);        

        const updateTxAddRECIssuer = await ArkreenRegistryFactory.addRECIssuer(Issuer_address, ArkreenRECToken_address, Issuer_name)
        await updateTxAddRECIssuer.wait()
        console.log("AddRECIssuer Initialized: %s: ", hre.network.name, Issuer_address, ArkreenRECToken_address, Issuer_name);        

        console.log("ArkreenRegistry Initialized to %s: ", hre.network.name, ArkreenRegistryFactory.address);
    } 
};

func.tags = ["gRegistryI"];

export default func;
