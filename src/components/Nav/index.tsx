import { useState } from 'react'
import styles from './index.module.scss'

function Nav() {
  return (
    <div className={styles['nav-flow']}>
      <div className={styles['rb-ele']} data-e="true">
        <i className={styles['rb-ele__dot']}></i>
      </div>
      <Logo />
      <Menu />
      <PageNum />
    </div>
  )
}

function Logo() {
  return (
    <a className={styles['left-logo']} data-e="true">
      <span className="text-4xl font-black text-white pointer-events-none f-bs">
        Brid
        <span className="text-primary f-bs">9</span>e
      </span>
    </a>
  )
}

function Menu() {
  const [show, setShow] = useState(false)
  const menuList = [
    {
      label: 'Me',
      path: '/me'
    },
    {
      label: 'Projects',
      path: '/prj'
    },
    {
      label: 'Talks',
      path: '/prj'
    }
  ]

  function onShowMenu() {
    setShow(!show)
  }

  return (
    <div className={styles['right-menu__content']}>
      <a
        className={`${styles['right-menu']} ${show && styles['is-show']}`}
        data-e="true"
        onClick={onShowMenu}>
        {[1, 2, 3].map((key) => (
          <i key={key} className={styles['menu-line']}></i>
        ))}
      </a>
      <div className={`${styles['menu-box']} ${show && styles['is-show']}`}>
        {menuList.map((item) => (
          <a
            className={styles['menu-box__item']}
            key={item.label}
            data-e="true">
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}

function PageNum() {
  return (
    <div className={styles['page-num']} data-e="true">
      <span className={`text-primary font-bold ${styles['page-num__item']}`}>
        1
      </span>
      <span className={`text-white font-bold mx-2 ${styles['page-num__item']}`}>
        /
      </span>
      <span className={`text-white font-bold ${styles['page-num__item']}`}>
        3
      </span>
    </div>
  )
}

export default Nav
