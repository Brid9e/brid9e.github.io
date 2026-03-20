/// <reference types="vite/client" />

declare module '*.scss' {
  const styles: { [key: string]: string }
  export default styles
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}
