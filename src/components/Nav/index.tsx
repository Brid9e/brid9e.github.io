import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  const navigate = useNavigate()

  return (
    <div
      className={styles['left-logo']}
      data-e="true"
      onClick={() => navigate('/')}>
      <span className="text-4xl font-black text-white pointer-events-none f-bs">
        Brid
        <span className="text-primary f-bs">9</span>e
      </span>
    </div>
  )
}

function Menu() {
  const [show, setShow] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const menuList = [
    {
      label: 'Me',
      path: '/me'
    },
    {
      label: 'Projects',
      path: '/projects'
    },
    {
      label: 'Talks',
      path: '/talks'
    }
  ]

  function onShowMenu() {
    setShow(!show)
  }

  function onClickMenu(item: any) {
    navigate(item.path)
    // onShowMenu()
  }

  return (
    <>
      <div className={styles['right-menu__content']}>
        <div className={styles['menu-normal']}>
          {menuList.map((item) => (
            <a
              onClick={() => onClickMenu(item)}
              className={`${styles['menu-box__item']} ${
                location.pathname === item?.path && styles['menu-normal-active']
              }`}
              key={item.label}
              data-e="true">
              {item.label}
            </a>
          ))}
        </div>
        <div className={styles['menu-mobile']}>
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
                onClick={() => onClickMenu(item)}
                className={`${styles['menu-box__item']} ${
                  location.pathname === item?.path &&
                  styles['menu-mobile-active']
                }`}
                key={item.label}
                data-e="true">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
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
