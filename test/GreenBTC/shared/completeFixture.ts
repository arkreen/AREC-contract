import { Fixture } from 'ethereum-waffle'
import { ethers } from 'hardhat'
import { v3RouterFixture } from './externalFixtures'
import { constants } from 'ethers'
import {
  IWETH9,
  MockTimeNonfungiblePositionManager,
  MockTimeSwapRouter,
  NonfungibleTokenPositionDescriptor,
  TestERC20Uni,
  IUniswapV3Factory,
} from '../../../typechain'

const completeFixture: Fixture<{
  weth9: IWETH9
  factory: IUniswapV3Factory
  router: MockTimeSwapRouter
  nft: MockTimeNonfungiblePositionManager
  nftDescriptor: NonfungibleTokenPositionDescriptor
  tokens: [TestERC20Uni, TestERC20Uni, TestERC20Uni]
}> = async ([wallet], provider) => {
  const { weth9, factory, router } = await v3RouterFixture([wallet], provider)

  const tokenFactory = await ethers.getContractFactory('TestERC20Uni')
  const tokens: [TestERC20Uni, TestERC20Uni, TestERC20Uni] = [
    (await tokenFactory.deploy(constants.MaxUint256.div(2))) as TestERC20Uni, // do not use maxu256 to avoid overflowing
    (await tokenFactory.deploy(constants.MaxUint256.div(2))) as TestERC20Uni,
    (await tokenFactory.deploy(constants.MaxUint256.div(2))) as TestERC20Uni,
  ]

  const nftDescriptorLibraryFactory = await ethers.getContractFactory('NFTDescriptor')
  const nftDescriptorLibrary = await nftDescriptorLibraryFactory.deploy()
  const positionDescriptorFactory = await ethers.getContractFactory('NonfungibleTokenPositionDescriptor', {
    libraries: {
      NFTDescriptor: nftDescriptorLibrary.address,
    },
  })
  const nftDescriptor = (await positionDescriptorFactory.deploy(
    tokens[0].address,
    // 'ETH' as a bytes32 string
    '0x4554480000000000000000000000000000000000000000000000000000000000'
  )) as NonfungibleTokenPositionDescriptor

  const positionManagerFactory = await ethers.getContractFactory('MockTimeNonfungiblePositionManager')
  const nft = (await positionManagerFactory.deploy(
    factory.address,
    weth9.address,
    nftDescriptor.address
  )) as MockTimeNonfungiblePositionManager

  tokens.sort((a, b) => (a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1))

  return {
    weth9,
    factory,
    router,
    tokens,
    nft,
    nftDescriptor,
  }
}

export default completeFixture
