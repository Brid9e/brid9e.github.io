import { memo } from 'react'
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router'

import Nav from '@/components/Nav'
import Container from '@/components/Container'
import { Mouse } from '@/components/PageControl'

const ContainerMemo = memo(function ContainerMemo({
  color
}: {
  color?: string
}) {
  return <Container />
})

function Home() {
  return (
    <div>
      <HashRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<ContainerMemo />} />
          <Route path="/me" element={<ContainerMemo />} />
          <Route path="/projects" element={<ContainerMemo />} />
          <Route path="/talks" element={<ContainerMemo />} />
        </Routes>
      </HashRouter>
      <div className="noise"></div>
      <Mouse />
    </div>
  )
}

export default Home
