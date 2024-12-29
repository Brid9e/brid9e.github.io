import { useState, useEffect } from 'react'
import { useMouse } from 'ahooks'
import styles from './index.module.scss'

export function Mouse() {
  // const [currentX, setCurrentX] = useState(0)
  // const [currentY, setCurrentY] = useState(0)
  // const speed = 0.2
  const mouse = useMouse()

  // useEffect(() => {
  //   let animationFrameId: number

  //   const animate = () => {
  //     setCurrentX((prevX) => prevX + (mouse.clientX - prevX) * speed)
  //     setCurrentY((prevY) => prevY + (mouse.clientY - prevY) * speed)
  //     animationFrameId = requestAnimationFrame(animate)
  //   }

  //   animationFrameId = requestAnimationFrame(animate) // 启动动画

  //   return () => {
  //     cancelAnimationFrame(animationFrameId) // 组件卸载时清理动画
  //   }
  // }, [mouse.clientX, mouse.clientY, speed])

  return (
    <div
      className={styles.mouse}
      style={{
        transform: `translate(${mouse.clientX}px, ${mouse.clientY}px)`
      }}></div>
  )
}
