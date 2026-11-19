import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'

export type CubeMaterial = 'plastique' | 'bois' | 'metal'

export type Settings = {
  cubeMaterial: CubeMaterial
}

type SettingsAction = { type: 'setCubeMaterial'; material: CubeMaterial }

type SettingsContextValue = {
  settings: Settings
  dispatch: Dispatch<SettingsAction>
}

const STORAGE_KEY = 'reglages-generaux'
const DEFAULT_SETTINGS: Settings = { cubeMaterial: 'plastique' }

function settingsReducer(settings: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'setCubeMaterial':
      return { ...settings, cubeMaterial: action.material }
  }
}

function loadSettings(): Settings {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) {
    return DEFAULT_SETTINGS
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, null, loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  return (
    <SettingsContext.Provider value={{ settings, dispatch }}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  const value = useContext(SettingsContext)
  if (value === null) {
    throw new Error('useSettings doit être utilisé à l’intérieur de <SettingsProvider>')
  }
  return value
}
