import createCustomEvent from '../utils/createCustomEvent'
import { RAF } from '../constants/index'

class RAFManager {
  constructor() {
    this.itemCount = 0
  }

  addItem(callback) {
    if (this.itemCount === 0) {
      this.start()
    }
    this.itemCount += 1
    window.addEventListener(RAF, callback)
  }

  removeItem(callback) {
    if (this.itemCount <= 0) {
      return
    }

    this.itemCount -= 1
    if (this.itemCount === 0) {
      this.cancel()
    }
    window.removeEventListener(RAF, callback)
  }

  handleRAF = now => {
    // now === time in ms
    window.dispatchEvent(createCustomEvent(RAF, { now }))
    this.raf = window.requestAnimationFrame(this.handleRAF)
  }

  start = () => {
    this.raf = window.requestAnimationFrame(this.handleRAF)
  }

  cancel = () => {
    window.cancelAnimationFrame(this.raf)
  }
}

export default new RAFManager()
