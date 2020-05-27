// Styles - webpack will handover the styles to the jekyll assets folder
import '_scss/main.scss'

// JS
// Managers
import './managers/RAFManager'
// Components
import cube from '_components/cube'

// DOMContent loaded
(() => {
  cube()
})()
