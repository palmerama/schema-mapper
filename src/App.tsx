import type {SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'
import {ThemeProvider, Spinner, usePrefersDark} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {Suspense, useEffect} from 'react'
import {HashRouter, Routes, Route, Navigate} from 'react-router-dom'
import {LiveOrgOverview} from './components/LiveOrgOverview'
import './styles/globals.css'

const theme = buildTheme()

const config: SanityConfig[] = [
  {
    projectId: 'YOUR_PROJECT_ID', // TODO: Replace with your Sanity project ID
    dataset: 'production',
  },
]

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-screen">
      <Spinner muted />
      <p className="text-sm text-muted-foreground">Loading Schema Mapper…</p>
    </div>
  )
}

function DarkModeProvider({ children }: { children: React.ReactNode }) {
  // usePrefersDark() from @sanity/ui subscribes to prefers-color-scheme media query.
  // We mirror it to a .dark class on the root so that:
  // 1. sanity-theme.css .dark {} CSS variable overrides activate
  // 2. useDarkMode() hook can detect it for runtime values (Background, MiniMap)
  const prefersDark = usePrefersDark()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefersDark)
  }, [prefersDark])
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <DarkModeProvider>
        <SanityApp config={config} fallback={<LoadingScreen />}>
          <Suspense fallback={<LoadingScreen />}>
            <HashRouter>
              <Routes>
                <Route path="/:orgId/:projectId/:dataset" element={<LiveOrgOverview />} />
                <Route path="/:orgId/:projectId" element={<LiveOrgOverview />} />
                <Route path="/:orgId" element={<LiveOrgOverview />} />
                <Route path="/" element={<LiveOrgOverview />} />
              </Routes>
            </HashRouter>
          </Suspense>
        </SanityApp>
      </DarkModeProvider>
    </ThemeProvider>
  )
}
