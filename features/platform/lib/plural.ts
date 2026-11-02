// "1 line item", "2 line items": counts in staff copy without "(s)".
export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
