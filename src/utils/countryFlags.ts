/**
 * Nahrazení kódu země v hranatých závorkách vlajkovou emoji.
 *
 * Reaguje jen na velká písmena (`[CZ]`, ne `[cz]`) a jen na platné kódy
 * ISO 3166-1 alpha-2 — jinak by se z `[HQ]` nebo `[FM]` staly nesmyslné vlajky.
 */

// ISO 3166-1 alpha-2, oficiálně přidělené kódy
const ISO_3166_1_ALPHA_2 = new Set(
  `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS
   BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE
   EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM
   HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC
   LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA
   NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
   SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO
   TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(/\s+/)
)

const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 'A'.charCodeAt(0)

/** `[XX]` s velkými písmeny; validita kódu se řeší až v parseStationName */
const COUNTRY_TAG = /\[([A-Z]{2})\]/g

export interface NameSegment {
  type: 'text' | 'flag'
  /** text k vypsání — u vlajky emoji, jinak původní úsek názvu */
  value: string
  /** kód země, jen u vlajky (pro title/aria-label) */
  code?: string
}

export function isCountryCode(code: string): boolean {
  return ISO_3166_1_ALPHA_2.has(code)
}

export function toFlagEmoji(code: string): string {
  return [...code]
    .map(char => String.fromCodePoint(char.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET))
    .join('')
}

/**
 * Rozpadne název na úseky textu a vlajek. Neplatné kódy (`[XX]`, `[HQ]`)
 * i malá písmena (`[cz]`) zůstávají jako text.
 */
export function parseStationName(name: string): NameSegment[] {
  const segments: NameSegment[] = []
  let lastIndex = 0

  for (const match of name.matchAll(COUNTRY_TAG)) {
    const code = match[1]
    if (!isCountryCode(code)) continue

    const before = name.slice(lastIndex, match.index)
    if (before) segments.push({ type: 'text', value: before })

    segments.push({ type: 'flag', value: toFlagEmoji(code), code })
    lastIndex = match.index + match[0].length
  }

  const rest = name.slice(lastIndex)
  if (rest) segments.push({ type: 'text', value: rest })

  return segments
}
