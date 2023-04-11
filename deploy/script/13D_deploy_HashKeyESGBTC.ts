import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.HskBTC, deployer);  

  const HashKeyESGBTC = await deploy(CONTRACTS.HskBTC, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("HashKeyESGBTC deployed to %s: ", hre.network.name, HashKeyESGBTC.address);
};

// 2023/03/05
// deploy:matic_test:HskBTCD
// 0xaB3B018Eed1216d27739CFCC8501Bb36a7A18074

// 2023/03/05
// deploy:matic_test:HskBTCD
// 0x084726129D09976D236642CdCE648039BaE2b072

// 2023/03/07
// deploy:matic_test:HskBTCD: return owners in getAllBrickIDs
// 0xd5F14899428e135B1684ba653487795eF39242B9

// 2023/03/14
// deploy:matic_test:HskBTCD: Urgrade to support: 1 cell-> 2ART, MVP feature (>21cells)
// 0x16F40BF24E7232056800b0601d6f36121f66ff44

// 2023/03/18
// deploy:matic_test:HskBTCD: add API getMVPBlocks, and the flag in brickIds to indicate MVP
// 0xF9Be1Dc7Be9659A4EB47D26581a864fCef10631E

// 2023/03/18
// deploy:matic_test:HskBTCD: Fix the compatibility problem in test
// 0x7D427484834e9d89F5777EBef16f5f2CF83E9093

// 2023/04/03
// deploy:matic_test:HskBTCD: Add the NFT picture and relative logic
// 0x3980b7c60fa541d126f1c8905f815f658d10611a

// 2023/04/04: 
// deploy:matic_test:HskBTCD: Change name to 'Eco Coiner', and store all CID in one bytes 
// 0x0Cfe77bE0225A39e5Bb9aB2DEAd3a1350a90d14a

// 2023/04/04: 
// deploy:matic_test:HskBTCD: Revert to old CID handle logic 
// 0x999452ad1f9ed7809100106507b5317b796e8851

// 2023/04/07: 
// deploy:matic_test:HskBTCD: Update to update ESGBadgeCount in ABI
// 0x4DC958E9F1c8950e8a8976e6d81eAbE55f6f7a21

func.tags = ["HskBTCD"];

export default func;
