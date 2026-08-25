/**
 * Trvalé úložiště pro playlist.
 *
 * Dřív to byla cookie, jenže ta má limit ~4 kB a při jeho překročení
 * `document.cookie` tiše neudělá vůbec nic — playlist se přestal ukládat bez
 * jediné chyby a uživateli mizely přidané stanice. localStorage má limit ~5 MB
 * a při zaplnění vyhodí výjimku, takže se o selhání dozvíme.
 *
 * Cookie se stále čte, aby stávající uživatelé o playlist nepřišli; po první
 * úspěšné migraci se maže.
 */

const COOKIE_DAYS = 365

function isSecureContext(): boolean {
  return window.location.protocol === 'https:'
}

function readCookie(name: string): string | null {
  const nameEQ = `${name}=`
  const found = document.cookie.split(';').find(c => c.trim().startsWith(nameEQ))
  return found ? decodeURIComponent(found.trim().slice(nameEQ.length)) : null
}

function deleteCookie(name: string): void {
  const secure = isSecureContext() ? ';Secure' : ''
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax${secure}`
}

function writeCookie(name: string, value: string): void {
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000)
  const secure = isSecureContext() ? ';Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`
}

function isLocalStorageAvailable(): boolean {
  try {
    const probe = '__streamer_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    // privátní režim nebo zakázané úložiště
    return false
  }
}

/**
 * Přečte hodnotu z localStorage; když tam není, zkusí starou cookie a rovnou ji
 * zmigruje. Vrací null, když není ani jedno.
 */
export function readStored(key: string, legacyCookie: string): string | null {
  if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem(key)
    if (stored !== null) return stored

    const migrated = readCookie(legacyCookie)
    if (migrated !== null && writeStored(key, migrated)) {
      deleteCookie(legacyCookie)
      return migrated
    }
    return migrated
  }

  return readCookie(legacyCookie)
}

/**
 * Uloží hodnotu a ověří ji zpětným čtením. Vrací false, když se uložit nepovedlo
 * — volající to musí umět ukázat, ne spolknout.
 */
export function writeStored(key: string, value: string): boolean {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(key, value)
      return localStorage.getItem(key) === value
    } catch (e) {
      console.warn(`Failed to save "${key}" to localStorage:`, e)
      return false
    }
  }

  // localStorage není k dispozici — zkusíme cookie, ale ověříme, že se opravdu
  // zapsala (přes limit cookie tiše zmizí)
  writeCookie(key, value)
  return readCookie(key) === value
}
