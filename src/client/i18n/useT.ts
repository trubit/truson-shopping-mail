import { useLanguageStore } from '../store/languageStore.js'
import { getTranslations } from './translations.js'

export function useT() {
  const currentLang = useLanguageStore((s) => s.currentLang)
  return getTranslations(currentLang)
}
