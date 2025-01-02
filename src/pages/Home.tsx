import { memo } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'

import Nav from '@/components/Nav'
import Container from '@/components/Container'
import { Mouse } from '@/components/PageControl'

const ContainerMemo = memo(function ContainerMemo({
  color
}: {
  color?: string
}) {
  return <Container color={color} />
})

function Home() {
  return (
    <div>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<ContainerMemo />} />
          <Route path="/me" element={<ContainerMemo color="blue" />} />
          <Route path="/projects" element={<ContainerMemo color="yellow" />} />
          <Route path="/talks" element={<ContainerMemo color="red" />} />
        </Routes>
      </BrowserRouter>
      <div className="noise"></div>
      <Mouse />
    </div>
  )
}

export default Home
