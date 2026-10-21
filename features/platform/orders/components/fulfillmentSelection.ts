export function currentFulfillmentSelection(options: readonly string[], selected: string) {
  return options.includes(selected) ? selected : options[0] || ''
}
