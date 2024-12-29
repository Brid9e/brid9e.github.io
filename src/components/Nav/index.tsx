import styles from './index.module.scss'

function Nav() {
  return (
    <div className={styles['nav-flow']}>
      <a className={styles['left-logo']}>
        <span className="text-4xl font-black text-white f-bs">Brid9E</span>
      </a>
      <a className={styles['right-menu']}>
        {[1, 2, 3].map((key) => (
          <i key={key} className={styles['menu-line']}></i>
        ))}
      </a>
      <i className={styles['rb-ele']}></i>
    </div>
  )
}

export default Nav
