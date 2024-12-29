import Nav from '@/components/Nav'
import Container from '@/components/Container'
import { Mouse } from '@/components/PageControl'

function Home() {
  return (
    <div>
      <Nav />
      <Container />
      <div className="noise"></div>
      <Mouse />
    </div>
  )
}

export default Home
