// Minimal i18n helper with dictionary-based lookup

import en from '../i18n/en.json'

const dictionaries = {
  en
}

let currentLocale = 'en'

export const i18n = {
  t(key, vars = {}) {
    const dict = dictionaries[currentLocale] || {}
    let str = dict[key] || key
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`{${k}}`, 'g'), String(v))
    })
    return str
  },
  setLocale(locale) {
    if (dictionaries[locale]) currentLocale = locale
  },
  getLocale() {
    return currentLocale
  }
}


