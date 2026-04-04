const DEFAULT_LOCALE = 'fr-CH'

// Module-level formatters using navigator.language on client, fallback on server.
// Used by chart components (client-only, no SSR hydration concern).
const clientLocale = typeof navigator === 'undefined' ? DEFAULT_LOCALE : navigator.language

const shortDateFormatter = new Intl.DateTimeFormat(clientLocale, { year: 'numeric', month: '2-digit' })
const mediumDateFormatter = new Intl.DateTimeFormat(clientLocale, { year: 'numeric', month: 'short', day: 'numeric' })
const shortMonthDateFormatter = new Intl.DateTimeFormat(clientLocale, { year: '2-digit', month: 'short' })
const decimalFormatter = new Intl.NumberFormat(clientLocale, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 })


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


/**
 * Create locale-bound formatters for SSR-safe rendering.
 * Pass the same locale on server (from Accept-Language) and client
 * to avoid hydration mismatches.
 */
export function createFormatters(locale) {
   const loc = locale || DEFAULT_LOCALE
   const sd = new Intl.DateTimeFormat(loc, { year: 'numeric', month: '2-digit' })
   const md = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'short', day: 'numeric' })
   const dec = new Intl.NumberFormat(loc, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 })

   return {
      asDecimal: (number) => dec.format(number),
      asShortDate: (timestamp) => formatDate(sd, timestamp),
      asMediumDate: (timestamp) => formatDate(md, timestamp),
   }
}


/**
 * Parse an Accept-Language header and return the preferred locale.
 * Falls back to DEFAULT_LOCALE if the header is missing or empty.
 */
export function parseAcceptLanguage(header) {
   if (!header) {
      return DEFAULT_LOCALE
   }
   const first = header.split(',')[0]
   const locale = first.split(';')[0].trim()
   return locale || DEFAULT_LOCALE
}
