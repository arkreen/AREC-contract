import { BigNumber } from "ethers";
import JSBI from 'jsbi'

export const MaxUint256 = JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
export const NEGATIVE_ONE = JSBI.BigInt(-1)
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)

export const Q32 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(32))

function mulShift(val: JSBI, mulBy: string): JSBI {
    return JSBI.signedRightShift(JSBI.multiply(val, JSBI.BigInt(mulBy)), JSBI.BigInt(128))
}

export function getSqrtRatioAtTick(tick: number) {

    const MaxUint256 = BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    const Q32 = BigNumber.from(1).shl(32)
    const absTick: number = tick < 0 ? (tick * -1) : tick

    function mulShift(val: BigNumber, mulBy: string): BigNumber {
      return val.mul(BigNumber.from(mulBy)).shr(128)
    }

    let ratio: BigNumber =
      (absTick & 0x1) !== 0
        ? BigNumber.from('340265354078544963557816517032075149313')
        : BigNumber.from('340282366920938463463374607431768211456')
    if ((absTick & 0x2) !== 0) ratio = mulShift(ratio, '340248342086729790484326174814286782778')
    if ((absTick & 0x4) !== 0) ratio = mulShift(ratio, '340214320654664324051920982716015181260')
    if ((absTick & 0x8) !== 0) ratio = mulShift(ratio, '340146287995602323631171512101879684304')
    if ((absTick & 0x10) !== 0) ratio = mulShift(ratio, '340010263488231146823593991679159461444')
    if ((absTick & 0x20) !== 0) ratio = mulShift(ratio, '339738377640345403697157401104375502016')
    if ((absTick & 0x40) !== 0) ratio = mulShift(ratio, '339195258003219555707034227454543997025')
    if ((absTick & 0x80) !== 0) ratio = mulShift(ratio, '338111622100601834656805679988414885971')
    if ((absTick & 0x100) !== 0) ratio = mulShift(ratio, '335954724994790223023589805789778977700')
    if ((absTick & 0x200) !== 0) ratio = mulShift(ratio, '331682121138379247127172139078559817300')
    if ((absTick & 0x400) !== 0) ratio = mulShift(ratio, '323299236684853023288211250268160618739')
    if ((absTick & 0x800) !== 0) ratio = mulShift(ratio, '307163716377032989948697243942600083929')
    if ((absTick & 0x1000) !== 0) ratio = mulShift(ratio, '277268403626896220162999269216087595045')
    if ((absTick & 0x2000) !== 0) ratio = mulShift(ratio, '225923453940442621947126027127485391333')
    if ((absTick & 0x4000) !== 0) ratio = mulShift(ratio, '149997214084966997727330242082538205943')
    if ((absTick & 0x8000) !== 0) ratio = mulShift(ratio, '66119101136024775622716233608466517926')
    if ((absTick & 0x10000) !== 0) ratio = mulShift(ratio, '12847376061809297530290974190478138313')
    if ((absTick & 0x20000) !== 0) ratio = mulShift(ratio, '485053260817066172746253684029974020')
    if ((absTick & 0x40000) !== 0) ratio = mulShift(ratio, '691415978906521570653435304214168')
    if ((absTick & 0x80000) !== 0) ratio = mulShift(ratio, '1404880482679654955896180642')

    if (tick > 0) ratio = MaxUint256.div(ratio)

    // back to Q96
    let result =  ratio.mod(Q32).gt(0) 
      ? ratio.div(Q32).add(1)
      : ratio.div(Q32)

    return result
}

export function convertToPriceInNumber(priceX96: BigNumber): number {
  // Price = (2**192) * (10**18) * (10**18)  /  (10**6)  / (sqrtPriceX96**2)  asssuming Token0 = USDC, Token1 = Token, Precision = 18 
  //          X96,  Token Decimal, Precision, USDC Decimal,   Price in sqrtPriceX96
  const ether = BigNumber.from(10).pow(18)
  const priceInBigNumber = BigNumber.from(2).pow(192).mul(ether).mul(ether)
                            .div(BigNumber.from(10).pow(6)).div(priceX96.mul(priceX96))

  const priceInNumber = Number.parseInt(priceInBigNumber.toString()) / (10**18) 
  return priceInNumber
}

async function main() {

    let tick = 331517

    const absTick: number = tick < 0 ? (tick * -1) : tick

    const resultBI = getSqrtRatioAtTick(tick)
    const price = convertToPriceInNumber(resultBI)
    console.log("ResultBI:",  resultBI.toString(), price)

    let ratio: JSBI =
    (absTick & 0x1) !== 0
      ? JSBI.BigInt('0xfffcb933bd6fad37aa2d162d1a594001')
      : JSBI.BigInt('0x100000000000000000000000000000000')
    if ((absTick & 0x2) !== 0) ratio = mulShift(ratio, '0xfff97272373d413259a46990580e213a')
    if ((absTick & 0x4) !== 0) ratio = mulShift(ratio, '0xfff2e50f5f656932ef12357cf3c7fdcc')
    if ((absTick & 0x8) !== 0) ratio = mulShift(ratio, '0xffe5caca7e10e4e61c3624eaa0941cd0')
    if ((absTick & 0x10) !== 0) ratio = mulShift(ratio, '0xffcb9843d60f6159c9db58835c926644')
    if ((absTick & 0x20) !== 0) ratio = mulShift(ratio, '0xff973b41fa98c081472e6896dfb254c0')
    if ((absTick & 0x40) !== 0) ratio = mulShift(ratio, '0xff2ea16466c96a3843ec78b326b52861')
    if ((absTick & 0x80) !== 0) ratio = mulShift(ratio, '0xfe5dee046a99a2a811c461f1969c3053')
    if ((absTick & 0x100) !== 0) ratio = mulShift(ratio, '0xfcbe86c7900a88aedcffc83b479aa3a4')
    if ((absTick & 0x200) !== 0) ratio = mulShift(ratio, '0xf987a7253ac413176f2b074cf7815e54')
    if ((absTick & 0x400) !== 0) ratio = mulShift(ratio, '0xf3392b0822b70005940c7a398e4b70f3')
    if ((absTick & 0x800) !== 0) ratio = mulShift(ratio, '0xe7159475a2c29b7443b29c7fa6e889d9')
    if ((absTick & 0x1000) !== 0) ratio = mulShift(ratio, '0xd097f3bdfd2022b8845ad8f792aa5825')
    if ((absTick & 0x2000) !== 0) ratio = mulShift(ratio, '0xa9f746462d870fdf8a65dc1f90e061e5')
    if ((absTick & 0x4000) !== 0) ratio = mulShift(ratio, '0x70d869a156d2a1b890bb3df62baf32f7')
    if ((absTick & 0x8000) !== 0) ratio = mulShift(ratio, '0x31be135f97d08fd981231505542fcfa6')
    if ((absTick & 0x10000) !== 0) ratio = mulShift(ratio, '0x9aa508b5b7a84e1c677de54f3e99bc9')
    if ((absTick & 0x20000) !== 0) ratio = mulShift(ratio, '0x5d6af8dedb81196699c329225ee604')
    if ((absTick & 0x40000) !== 0) ratio = mulShift(ratio, '0x2216e584f5fa1ea926041bedfe98')
    if ((absTick & 0x80000) !== 0) ratio = mulShift(ratio, '0x48a170391f7dc42444e8fa2')

    if (tick > 0) ratio = JSBI.divide(MaxUint256, ratio)

    // back to Q96
    let result = JSBI.greaterThan(JSBI.remainder(ratio, Q32), ZERO)
      ? JSBI.add(JSBI.divide(ratio, Q32), ONE)
      : JSBI.divide(ratio, Q32)

      console.log("Result:",  result.toString())

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run ./deploy/tickMath.ts
