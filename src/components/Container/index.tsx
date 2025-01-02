import ThreeModel from '../ThreeModel'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useScroll } from 'ahooks'
import styles from './index.module.scss'
import { useRef } from 'react'

function Container({ color }: { color?: string }) {
  const container = useRef(null)

  const scroll = useScroll(container)

  useGSAP((context, contextSafe) => {}, {
    scope: container,
    dependencies: [scroll?.top],
    revertOnUpdate: true
  })

  return (
    <main ref={container} className={styles.content}>
      <div className={`${styles['page-item']} item-gsap`}>
        <ThreeModel color={color} />
      </div>
    </main>
  )
}

export default Container
