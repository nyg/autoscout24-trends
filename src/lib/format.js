const locales = typeof navigator !== 'undefined' ? navigator.language : 'fr-CH'

const shortDateFormatter = new Intl.DateTimeFormat(locales, { year: 'numeric', month: '2-digit' })
const longDateFormatter = new Intl.DateTimeFormat(locales, { year: 'numeric', month: '2-digit', day: '2-digit' })
const monthDateFormatter = new Intl.DateTimeFormat(locales, { year: 'numeric', month: 'long' })
const shortMonthDateFormatter = new Intl.DateTimeFormat(locales, { year: '2-digit', month: 'short' })
const percentageFormatter = new Intl.NumberFormat(locales, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const decimalFormatter = new Intl.NumberFormat(locales, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 })


const dateFormat = (formatter, date) =>
   formatter.format(date).replace(' ', ' ') // non-breaking space

export function asLongDate(timestamp) {
   return dateFormat(longDateFormatter, timestamp)
}

export function asShortDate(timestamp) {
   return dateFormat(shortDateFormatter, timestamp)
}

export function asMonthYearDate(timestamp) {
   return dateFormat(monthDateFormatter, timestamp)
}

export function asShortMonthYearDate(timestamp) {
   return dateFormat(shortMonthDateFormatter, timestamp)
}

export function asPercentage(number) {
   return percentageFormatter.format(number)
}

export function asDecimal(number) {
   return decimalFormatter.format(number)
}
