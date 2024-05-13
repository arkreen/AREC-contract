//import '@primitivefi/hardhat-dodoc';
import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import "hardhat-deploy"
import "@nomiclabs/hardhat-etherscan"
//import "@nomicfoundation/hardhat-verify"

import "hardhat-storage-layout"
import '@nomiclabs/hardhat-waffle'
import "hardhat-contract-sizer"
import "hardhat-gas-reporter"
import "solidity-coverage"
import "@openzeppelin/hardhat-upgrades"
//import { NetworkUserConfig } from "hardhat/types";

import { config as dotEnvConfig } from "dotenv"

dotEnvConfig()

function getAPIKey(network: string): string {
  let apiKey: string
  if((network === 'matic')||(network ==='matic_test')) {
    apiKey = process.env.POLYGONSCAN_API_KEY as string
  } else if((network === 'celo')||(network ==='celo_test')) {
    apiKey = process.env.CELOSCAN_API_KEY as string
  } else {
    apiKey = process.env.ETHERSCAN_API_KEY as string
  }
  return apiKey
}

//  url = `https://polygon-mainnet.infura.io/v3/` + projectID
//  url = `https://polygon-mumbai.infura.io/v3/` + projectID
// `https://polygon-rpc.com/`
// https://rpc-mumbai.maticvigil.com
// https://rpc.ankr.com/polygon_mumbai
// https://celo-mainnet.infura.io/v3/0ab4ce267db54906802cb43b24e5b0f7
// https://celo-alfajores.infura.io/v3/0ab4ce267db54906802cb43b24e5b0f7

function getURL(network:string): string {
  let url: string
  let projectID = process.env.PROJECT_ID
  if(network === 'celo') {
    url = `https://celo-mainnet.infura.io/v3/` + projectID
  } else if(network === 'celo_test') {
    url = `https://celo-alfajores.infura.io/v3/` + projectID
  } else if(network === 'matic') {
    url = `https://polygon-rpc.com/`
  } else if(network === 'matic_test') {
    url = `https://rpc.ankr.com/polygon_mumbai`
  } else if(network === 'goerli') {
    url = `https://goerli.infura.io/v3/`+ projectID
  } else if(network === 'rinkeby') {
    url = `https://rinkeby.infura.io/v3/`+ projectID    
  } else {
    url = `https://mainnet.infura.io/v3/`+ projectID
  }
  return url
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
    goerli: {
      url: getURL("goerli"),
      accounts: [process.env.ETH_RINKEBY_PRIVATE_KEY as string],
    },     
    rinkeby: {
      url: getURL("rinkeby"),
      accounts: [process.env.ETH_RINKEBY_PRIVATE_KEY as string],
    },
    celo_test: {
      url: getURL("celo_test"),
      accounts: [process.env.MATIC_TESTNET_PRIVATE_KEY as string, process.env.MATIC_TESTNET_CONFIRM_KEY as string],
    },
    celo: {
      url: getURL("celo"),
      chainId: 42220,
      accounts: [process.env.MATIC_PRIVATE_KEY as string, process.env.MATIC_CONTROLLER_KEY as string],
    },
    matic_test: {
      url: getURL("matic_test"),
      accounts: [process.env.MATIC_TESTNET_PRIVATE_KEY as string, process.env.MATIC_TESTNET_CONFIRM_KEY as string],
    },
    matic: {
      url: getURL("matic"),
      chainId: 137,
      accounts: [process.env.MATIC_PRIVATE_KEY as string, process.env.MATIC_CONTROLLER_KEY as string],
    },
    BSC_TEST: {
      url: "https://data-seed-prebsc-2-s1.binance.org:8545/",
      accounts: [process.env.BSC_TESTNET_PRIVATE_KEY as string],
    },
    BSC: {
      url: process.env.BSC_MAINNET_RPC,
      accounts: [process.env.BSC_MAINNET_PRIVATE_KEY as string],
    },    
  },
  solidity: {
    compilers: [
      {
        version: "0.6.6",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 500,
          },
        },
      },
      {
        version: "0.7.6",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 500,
          },
        },
      },
      {
        version: "0.8.9",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 500,
          },
        },
      },
    ],
    settings: {
        outputSelection: {
            "*": {
                "*": ["storageLayout"],
            },
        },
    },
    overrides: {
      "contracts/GreenBTC.sol": {
        version: "0.8.9",
        settings: {
          metadata: {
            bytecodeHash: "none",
            useLiteralContent: true
          },
          optimizer: {
            enabled: true,
            runs: 0,
          },
          outputSelection: {
            "*": {
                "*": ["storageLayout"],
            },
          },
        },
      },
      "contracts/ArkreenRECIssuance.sol": {
        version: "0.8.9",
        settings: {
          metadata: {
            bytecodeHash: "none",
            useLiteralContent: true
          },
          optimizer: {
            enabled: true,
            runs: 100,
          },
          outputSelection: {
            "*": {
                "*": ["storageLayout"],
            },
          },
        },
      },
      "contracts/test/ArkreenMinerU.sol": {
        version: "0.8.9",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  typechain: {
    outDir: "./typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: {
      celo:        getAPIKey("celo"),
      celo_test:   getAPIKey("celo_test"),
      matic:        getAPIKey("matic"),
      matic_test:   getAPIKey("matic_test"),
      mainnet:      getAPIKey("mainnet"),
      ropsten:      getAPIKey("ropsten"),
      rinkeby:      getAPIKey("rinkeby"),
      goerli:       getAPIKey("goerli"),
      kovan:        getAPIKey("kovan"),
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: getURL("celo"),
          browserURL: "https://celoscan.io/"
        }
      },
      {
        network: "celo_test",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/",
          browserURL: "https://alfajores.celoscan.io/"
        }
      },
      {
        network: "matic",
        chainId: 137,
        urls: {
          apiURL: "https://polygon-rpc.com",
          browserURL: "https://polygonscan.com/"
        }
      },
      {
        network: "matic_test",
        chainId: 80001,
        urls: {
          apiURL: getURL("matic_test"),
          browserURL: "https://mumbai.polygonscan.com/"
        }
      },
    ]
  },  
  namedAccounts: {
    deployer: 0,
    tokenOwner: 1,
  },
  contractSizer: {
    alphaSort:          false,
    runOnCompile:       false,
    disambiguatePaths:  false,
  },
  mocha: {
    timeout: 1000000
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",                // "./test", "./test/GreenBTC" GreenBTC
    deploy: "./deploy/script",
    deployments: "./deployments",
  },
};

export default config;