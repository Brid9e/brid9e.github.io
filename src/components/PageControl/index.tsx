import { useState, useEffect, MouseEvent } from 'react'
import { useMouse } from 'ahooks'
import styles from './index.module.scss'

export function Mouse() {
  const mouse = useMouse()
  const [cursor, setCursor] = useState(false)

  document.addEventListener('mousemove', (event: any) => {
    setCursor(event?.target?.dataset?.e === 'true')
  })

  return (
    <div
      className={styles.mouse}
      data-cursor={cursor}
      style={{
        transform: `translate(${mouse.clientX}px, ${mouse.clientY}px)`
      }}></div>
  )
}
