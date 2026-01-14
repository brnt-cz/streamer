export const translations = {
  en: {
    // Header
    appName: 'Streamer',

    // StreamPlayer
    nowPlaying: 'Now Playing',
    selectStream: 'Select a stream',
    streamError: 'Failed to play stream',
    streamLoadError: 'Error loading stream',

    // PlaylistManager
    yourStations: 'Your Stations',
    add: 'Add stream',
    editStation: 'Edit Station',
    newStation: 'New Station',
    name: 'Name',
    namePlaceholder: 'My Radio Station',
    streamUrl: 'Stream URL',
    urlPlaceholder: 'https://...',
    saveChanges: 'Save Changes',
    addStation: 'Add Station',
    noStations: 'No stations yet',
    addFirstStation: 'Add your first station',
    export: 'Export',
    import: 'Import',
    invalidPlaylist: 'Invalid playlist file',
    failedToRead: 'Failed to read file',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirmTitle: 'Delete station?',
    deleteConfirmMessage: 'This action cannot be undone.',
    cancel: 'Cancel',
    confirmDelete: 'Delete',

    // RadioSelector
    browseRadios: 'Browse Radios',
    selectRadio: 'Select Radio',
    searchRadios: 'Search radios...',
    allCategories: 'All categories',
    noRadiosFound: 'No radios found',
    streamNotAvailable: 'Stream not available in this format',
    failedToGetStream: 'Failed to get stream URL',
    adding: 'Adding...',
    addToPlaylist: 'Add to Playlist',

    // Categories
    categories: {
      pop: 'Pop',
      rock: 'Rock',
      metal: 'Metal',
      jazz: 'Jazz',
      classic: 'Classical',
      dance: 'Dance',
      country: 'Country',
      oldies: 'Oldies',
      '80s': '80\'s',
      '90s': '90\'s',
      '00s': '00\'s',
      news: 'News',
      talk: 'Talk',
      folk: 'Folk',
      indie: 'Indie',
      hiphop: 'Hip Hop',
      house: 'House',
      funk: 'Funky',
      soul: 'Soul',
      rnb: 'R\'n\'B',
      ethno: 'Ethno',
      alternative: 'Alternative',
      gothic: 'Gothic',
      kids: 'Kids',
      bigbit: 'Bigbeat',
      dechovka: 'Brass Music',
      softac: 'Soft AC',
      hotac: 'Hot AC',
      allformat: 'All Format',
      Trance: 'Trance'
    }
  },
  cs: {
    // Header
    appName: 'Streamer',

    // StreamPlayer
    nowPlaying: 'Nyní hraje',
    selectStream: 'Vyberte stream',
    streamError: 'Nepodařilo se přehrát stream',
    streamLoadError: 'Chyba při načítání streamu',

    // PlaylistManager
    yourStations: 'Vaše stanice',
    add: 'Přidat stream',
    editStation: 'Upravit stanici',
    newStation: 'Nová stanice',
    name: 'Název',
    namePlaceholder: 'Moje rádio',
    streamUrl: 'URL streamu',
    urlPlaceholder: 'https://...',
    saveChanges: 'Uložit změny',
    addStation: 'Přidat stanici',
    noStations: 'Zatím žádné stanice',
    addFirstStation: 'Přidejte první stanici',
    export: 'Exportovat',
    import: 'Importovat',
    invalidPlaylist: 'Neplatný soubor playlistu',
    failedToRead: 'Nepodařilo se přečíst soubor',
    edit: 'Upravit',
    delete: 'Smazat',
    deleteConfirmTitle: 'Smazat stanici?',
    deleteConfirmMessage: 'Tuto akci nelze vrátit zpět.',
    cancel: 'Zrušit',
    confirmDelete: 'Smazat',

    // RadioSelector
    browseRadios: 'Procházet rádia',
    selectRadio: 'Vybrat rádio',
    searchRadios: 'Hledat rádia...',
    allCategories: 'Všechny kategorie',
    noRadiosFound: 'Žádná rádia nenalezena',
    streamNotAvailable: 'Stream není dostupný v tomto formátu',
    failedToGetStream: 'Nepodařilo se získat URL streamu',
    adding: 'Přidávám...',
    addToPlaylist: 'Přidat do playlistu',

    // Categories
    categories: {
      pop: 'Pop',
      rock: 'Rock',
      metal: 'Metal',
      jazz: 'Jazz',
      classic: 'Klasika',
      dance: 'Dance',
      country: 'Country',
      oldies: 'Oldies',
      '80s': '80\'s',
      '90s': '90\'s',
      '00s': '00\'s',
      news: 'Zprávy',
      talk: 'Mluvené slovo',
      folk: 'Folk',
      indie: 'Indie',
      hiphop: 'Hip Hop',
      house: 'House',
      funk: 'Funky',
      soul: 'Soul',
      rnb: 'R\'n\'B',
      ethno: 'Ethno',
      alternative: 'Alternative',
      gothic: 'Gothic',
      kids: 'Pro děti',
      bigbit: 'Bigbít',
      dechovka: 'Dechovka',
      softac: 'Soft AC',
      hotac: 'Hot AC',
      allformat: 'All Format',
      Trance: 'Trance'
    }
  }
} as const

export type TranslationKey = keyof typeof translations.en
export type CategoryKey = keyof typeof translations.en.categories
