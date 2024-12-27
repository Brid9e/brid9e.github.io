import styles from './index.module.scss'

function Nav() {
  return (
    <nav className={styles.nav}>
      <div className="left-logo">
        <span className="text-white text-4xl sjn">
          BRID
          <span className="text-p text-5xl">9</span>E
        </span>
      </div>
    </nav>
  )
}

export default Nav
