import createCustomEvent from '../utils/createCustomEvent'
import { MOUSE_MOVE } from '../constants/index'

class MouseManager {
  constructor() {
    this.itemCount = 0
  }

  addItem(callback) {
    if (this.itemCount === 0) {
      this.start()
    }
    this.itemCount += 1
    window.addEventListener(MOUSE_MOVE, callback)
  }

  removeItem(callback) {
    if (this.itemCount <= 0) {
      return
    }

    this.itemCount -= 1
    if (this.itemCount === 0) {
      this.cancel()
    }
    window.removeEventListener(MOUSE_MOVE, callback)
  }

  handleMouseMove = e => {
    window.dispatchEvent(createCustomEvent(MOUSE_MOVE, { x: e.clientX, y: e.clientY }))
  }

  start = () => {
    window.addEventListener('mousemove', this.handleMouseMove)
  }

  cancel = () => {
    window.removeEventListener('mousemove', this.handleMouseMove)
  }
}

export default new MouseManager()
