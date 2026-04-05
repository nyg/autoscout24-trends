const DEFAULT_LOCALE = 'fr-CH'

const formatDate = (formatter, date) =>
   formatter.format(date).replace(' ', '\u00A0') // non-breaking space


/**
 * Create locale-bound formatters.
 * On the server the locale comes from Accept-Language; on the client
 * the same value is reused via context so SSR and hydration match.
 */
export function createFormatters(locale) {
   const loc = locale || DEFAULT_LOCALE
   const sd = new Intl.DateTimeFormat(loc, { year: 'numeric', month: '2-digit' })
   const md = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'short', day: 'numeric' })
   const smy = new Intl.DateTimeFormat(loc, { year: '2-digit', month: 'short' })
   const dec = new Intl.NumberFormat(loc, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 })

   return {
      asDecimal: (number) => dec.format(number),
      asShortDate: (timestamp) => formatDate(sd, timestamp),
      asMediumDate: (timestamp) => formatDate(md, timestamp),
      asShortMonthYearDate: (timestamp) => formatDate(smy, timestamp),
      asTime: (timestamp) => {
         if (!timestamp) {
            return ''
         }
         return new Date(timestamp).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
      },
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
