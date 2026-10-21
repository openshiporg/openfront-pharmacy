/** Integer allocation of the frozen full-fill price: partial charges sum exactly. */
export function fillPricePortion(price: number, authorized: number, alreadyDispensed: number, quantity: number) {
  if (![price, authorized, alreadyDispensed, quantity].every(Number.isSafeInteger) || price < 0 || authorized < 1
    || alreadyDispensed < 0 || quantity < 1 || alreadyDispensed + quantity > authorized) throw new Error('Fill price allocation is invalid')
  return Number((BigInt(price) * BigInt(alreadyDispensed + quantity)) / BigInt(authorized)
    - (BigInt(price) * BigInt(alreadyDispensed)) / BigInt(authorized))
}
