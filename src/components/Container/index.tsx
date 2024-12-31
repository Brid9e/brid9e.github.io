import ThreeModel from '../ThreeModel'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useScroll } from 'ahooks'
import styles from './index.module.scss'
import { useRef } from 'react'

function Container() {
  const container = useRef(null)

  const scroll = useScroll(container)

  useGSAP(
    (context, contextSafe) => {

    },
    { scope: container, dependencies: [scroll?.top], revertOnUpdate: true }
  )

  return (
    <main ref={container} className={styles.content}>
      {[1, 2, 3, 4, 5, 6, 7].map((key) => (
        <div key={key} className={`${styles['page-item']} item-gsap`}>
          <ThreeModel />
        </div>
      ))}
    </main>
  )
}

export default Container
