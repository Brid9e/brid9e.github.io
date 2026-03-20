import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

import Blog from '@/pages/Blog'
import LogListPage from '@/pages/LogListPage'

const DevLogPage = lazy(() => import('@/pages/DevLogPage'))

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Blog />} />
        <Route path="/blog" element={<LogListPage />} />
        <Route
          path="/log/:slug"
          element={
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center p-8 text-[15px] text-[var(--fg)] opacity-60">
                  加载中…
                </div>
              }>
              <DevLogPage />
            </Suspense>
          }
        />
      </Routes>
    </HashRouter>
  )
}
