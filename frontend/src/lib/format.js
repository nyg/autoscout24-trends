const locales = typeof navigator === 'undefined' ? 'fr-CH' : navigator.language

const shortDateFormatter = new Intl.DateTimeFormat(locales, { year: 'numeric', month: '2-digit' })
const mediumDateFormatter = new Intl.DateTimeFormat(locales, { year: 'numeric', month: 'short', day: 'numeric' })
const shortMonthDateFormatter = new Intl.DateTimeFormat(locales, { year: '2-digit', month: 'short' })
const decimalFormatter = new Intl.NumberFormat(locales, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 })


const formatDate = (formatter, date) =>
   formatter.format(date).replace(' ', '\u00A0') // non-breaking space

export function asMediumDate(timestamp) {
   return formatDate(mediumDateFormatter, timestamp)
}

export function asShortDate(timestamp) {
   return formatDate(shortDateFormatter, timestamp)
}

export function asShortMonthYearDate(timestamp) {
   return formatDate(shortMonthDateFormatter, timestamp)
}

export function asDecimal(number) {
   return decimalFormatter.format(number)
}
