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
        // Simulation mode 
//      const ArkreenRegistry_address    = '0x047eb5205251c5fc8a21ba8f8d46f57df62013c8'
//      const issuer  = 	"0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"
//      const tokenREC = 	"0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"
//      const tokenPay = 	"0x54e1c534f59343c56549c76d1bdccc8717129832"

        // 2023/03/28:  Matic testnet
        const ArkreenRegistry_address     = '0x61a914363ef99aabca69504cee5ccfd5523c845d'
        const issuer                      = "0x0AF6Fad1e63De91d5C53Af1dD2e55BB1b278b131"
        const tokenREC                    = "0x58Ac4e54a70b98960Ed5ecF9B9A2cd1AE83879Db"
        const tokenPay                    = "0x6c28fF02d3A132FE52D022db1f25a33d91caeCA2"

        const idAsset =   "AREC_HSK_ESG_BTC"
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

        // Version Test 
//      const ArkreenRegistry_address     = '0x3E8A27dA0BF241f588141659cBb6Bd39717527F1'
//      const ArkreenMiner_address        = '0xAc4da3681e51278f82288617c7185a7a119E5b7B'
//      const ArkreenRECIssuance_address  = '0x45D0c0E2480212A60F1a9f2A820F1d7d6472CA6B'
//      const ArkreenRECToken_address     = '0x815bFE3aaCF765c9E0A4DdEb98Ad710a4Fb860d3'
//      const ArkreenRECBadge_address     = '0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337'

        // 2023/03/22: Normal release
        const ArkreenRegistry_address     = '0xb17faCaCA106fB3D216923DB6CaBFC7C0517029d'
        const ArkreenMiner_address        = '0xAc4da3681e51278f82288617c7185a7a119E5b7B'
        const ArkreenRECIssuance_address  = '0x954585adF9425F66a0a2FD8e10682EB7c4F1f1fD'
        const ArkreenRECToken_address     = '0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF'
        const ArkreenRECBadge_address     = '0x1e5132495cdaBac628aB9F5c306722e33f69aa24'

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

// 2023/03/28: call newAssetAREC for Matic testnet

func.tags = ["gRegistryI"];

export default func;
