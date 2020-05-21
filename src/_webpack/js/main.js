// Styles - webpack will handover the styles to the jekyll assets folder
import '_scss/main.scss'

// JS
// Polyfills
import 'intersection-observer'
// Managers
import './managers/RAFManager'
import './managers/ObserverManager'
// Components
import cube from '_components/cube'

// DOMContent loaded
(() => {
  // init modules if they are in the page
  cube()
})()
