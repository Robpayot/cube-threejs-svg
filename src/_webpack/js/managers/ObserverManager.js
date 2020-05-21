import { v4 as uuidv4 } from 'uuid'

const observerOptions = {
  rootMargin: '0% 0% -5% 0%', // detect at 5% at the bottom of the page
  threshold: 0,
}

const Strings = {
  SELECTOR_ITEMS: '[data-intersect-appear]',
}

/**
 * observe all element with the attribute "data-intersect-appear" and set them "entered-once"
 * if they appear in the viewport
 */
class ObserverManager {
  /**
   * Constructor
   */
  constructor() {
    this.observer = new IntersectionObserver(this.handleObserve, observerOptions)

    this.appearDict = {}

    this.ui = {
      appearEls: document.querySelectorAll(Strings.SELECTOR_ITEMS),
    }

    this.init()
  }

  addItem(el, callback) {
    const id = uuidv4()
    el.setAttribute('data-intersect-appear-id', id)
    this.appearDict[id] = { callback, el }
    // start observe
    this.observer.observe(el)
  }

  /**
   * Init all observers
   */
  init() {
    for (let i = 0; i < this.ui.appearEls.length; i++) {
      const id = uuidv4()
      const el = this.ui.appearEls[i]
      el.setAttribute('data-intersect-appear-id', id)
      this.appearDict[id] = { callback: null, el }
      // start observe
      this.observer.observe(el)
    }
  }

  /**
   * Observer callback
   * @param  {Array} entries
   */
  handleObserve = entries => {
    entries.forEach(entry => {
      const id = entry.target.dataset.intersectAppearId

      if (entry.isIntersecting) {
        entry.target.classList.add('entered-once')
        if (this.appearDict[id].callback) {
          this.appearDict[id].callback(true)
        } else {
          // if no callback, unobserve after it entered once
          this.observer.unobserve(entry.target)
        }
      } else if (this.appearDict[id] && this.appearDict[id].callback) {
        this.appearDict[id].callback(false)
      }
    })
  }
}

export default new ObserverManager()
