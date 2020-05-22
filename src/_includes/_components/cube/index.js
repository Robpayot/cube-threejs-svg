import * as THREE from 'three'
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { outExpo, outElastic } from '_js/utils/ease'
import getNow from '_js/utils/time'

import RAFManager from '_js/managers/RAFManager'
import MouseManager from '_js/managers/MouseManager'
import ObserverManager from '_js/managers/ObserverManager'

import shape1 from '_assets/cube/01_start.obj'
import shape2 from '_assets/cube/02b_face.obj'
import shape3 from '_assets/cube/03_face.obj'

const COLORS = {
  black: 0x000000,
  green: [0.01, 0.61, 0.29], // 1%, 61%, 29%
  yellow: [1, 0.77, 0.05], // 100%, 77%, 5%
  blue: [0, 0.47, 0.78], // 0%, 47%, 78%
}

class Cube {
  constructor(elem) {
    this.elem = elem
    this.sceneCSSScale = 0.5
    this.normalDuration = 3000
    this.longDuration = 4000
    this.durationRotate = 3000
    this.durationMorph = 3000
    this.durationCircleAppear = 500
    this.durationCircleScale = 1000
    this.mouse = {
      x: 0,
      y: 0,
    }
    this.mouseAngleY = 0
    this.mouseAngleZ = 0
    this.mouseMaxAngle = 10
    this.mouseDelay = 0.1
    this.extendCoef = 1.3
    this.htmlDivs = [{ text: 'THREE.JS' }, { text: 'SVG' }, { text: 'MORPHING' }]
    this.graphs = []
    this.targetCubeRotateY = 0
    this.targetCubeRotateZ = 0
    this.angleY = 0
    this.angleZ = 0
    this.axisRotate = new THREE.Vector3(0, 0, 0)
    this.startAnimation = 0
    this.transitionStarted = false
    this.phase = 0
    this.offsetCubeRotY = THREE.Math.degToRad(90)
    this.circleScale = 0.01

    this.shapes = [null, null, null]
    this.circleColors = [COLORS.green, COLORS.yellow, COLORS.blue]
    this.circleColor = [...COLORS.green] // need to be a different reference than COLORS.green
    this.targetColor = [0, 0, 0]
    this.OBJLoader = new OBJLoader()
    this.cubeParent = new THREE.Object3D()
    this.graphParent = new THREE.Object3D()

    this.graphOriginRotations = [
      new THREE.Euler(0, THREE.Math.degToRad(-90), THREE.Math.degToRad(-90)),
      new THREE.Euler(0, THREE.Math.degToRad(90), 0),
      new THREE.Euler(0, THREE.Math.degToRad(0), THREE.Math.degToRad(-90)),
    ]

    this.ui = {
      container: this.elem.querySelector('.cube__inner'),
    }

    this.mount()
  }

  mount() {
    this.load()
  }

  unmount() {
    this.events(false)
  }

  load() {
    const promises = [this.loadOBJ(shape1, 0), this.loadOBJ(shape2, 1), this.loadOBJ(shape3, 2)]

    Promise.all(promises).then(this.finishLoaded)
  }

  loadOBJ(url, index) {
    return new Promise(resolve => {
      this.OBJLoader.load(
        url,
        result => {
          this.shapes[index] = result
          resolve(result)
        },
        undefined,
        e => {
          console.log(e)
        },
      )
    })
  }

  finishLoaded = () => {
    this.setUnits()
    this.buildScene()
    this.buildRender()
    this.buildCamera()

    this.initCube()
    this.initCircle()
    this.elem.classList.add('transi-in')

    this.mainEvents(true)
    this.introCircle()

    this.started = true
    this.events(true)

    setTimeout(() => {
      this.loopPhases()
    }, 500)
  }

  events(enable) {
    if (enable) {
      this.elem.addEventListener('click', this.toggleStyle)
      window.addEventListener('resize', this.handleResize)
    } else {
      this.elem.removeEventListener('click', this.toggleStyle)
      window.removeEventListener('resize', this.handleResize)
    }
  }

  mainEvents(enable) {
    this.mainEventsActive = enable

    if (enable) {
      RAFManager.addItem(this.handleRAF)
      MouseManager.addItem(this.handleMouseMove)
    } else {
      RAFManager.removeItem(this.handleRAF)
      MouseManager.removeItem(this.handleMouseMove)
    }
  }

  introCircle() {
    this.showCircleStarted = true
    this.startAnimationCircle = getNow()
    this.circleOpacity = 0
    this.circleOpacityTarget = 1
    this.elem.classList.add('show-dot')
    this.circleScale = 0.01
    this.circleScaleTarget = 1
    this.showDot = true
  }

  loopPhases() {
    this.phase = 0

    let index = 0
    const mainDelay = 3400

    const loop = () => {
      const nextIndex = index + 1 > 2 ? 0 : index + 1
      this.phase = nextIndex
      this.targetColor = this.circleColors[nextIndex]
      let delayPhase = 0

      switch (index) {
        case 0:
          this.durationRotate = this.normalDuration
          this.durationMorph = this.normalDuration
          this.startTransition('y')
          break
        case 1:
          this.durationRotate = this.normalDuration
          this.durationMorph = this.normalDuration
          this.startTransition('z')
          break
        case 2:
          this.durationRotate = this.longDuration
          this.durationMorph = this.longDuration
          delayPhase = 800
          this.startTransition('init-state')
          break
        default:
      }

      this.htmlDivs[index].wrapper.classList.remove('is-playing')
      this.htmlDivs[nextIndex].wrapper.classList.add('is-playing')

      setTimeout(() => {
        loop()
      }, mainDelay + delayPhase)

      if (index === 2) {
        index = 0
      } else {
        index += 1
      }
    }

    loop()
  }

  buildScene() {
    this.scene = new THREE.Scene()
    this.sceneCSS = new THREE.Scene()
    this.sceneCSS.scale.set(this.sceneCSSScale, this.sceneCSSScale, this.sceneCSSScale)
  }

  buildRender() {
    this.renderer = new SVGRenderer()
    this.renderer.domElement.classList.add('cube__svgRenderer')
    this.renderer.setSize(this.width, this.height)
    this.renderer.setQuality('high')
    // this.renderer.setPrecision(100)
    this.ui.container.appendChild(this.renderer.domElement)

    this.rendererCSS = new CSS3DRenderer()
    this.rendererCSS.domElement.classList.add('cube__cssRenderer')
    this.rendererCSS.setSize(this.width, this.height)
    this.ui.container.appendChild(this.rendererCSS.domElement)
  }

  buildCamera() {
    const aspectRatio = this.width / this.height
    const fieldOfView = 10
    const nearPlane = 1
    const farPlane = 10000

    this.camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)

    this.camera.zoom = 1
    this.camera.position.set(-1600, 600, 900)
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))
    this.camera.updateProjectionMatrix()
  }

  initCube() {
    // edges
    const size = 100

    const lineMaterial = new THREE.LineBasicMaterial({
      color: COLORS.black,
      linewidth: size / 70,
    })

    const geometry = this.shapes[this.phase].children[0].geometry.clone() // clone() is very important here
    this.cube = new THREE.LineSegments(geometry, lineMaterial)
    this.cube.rotation.y = this.offsetCubeRotY
    this.cube.material = lineMaterial

    const offset = size / 7

    // create texts
    for (let i = 0; i < this.htmlDivs.length; i++) {
      let pos = new THREE.Vector3((-(size / 2 + offset) * 1) / this.sceneCSSScale, 0, 0)

      if (i === 1) {
        pos = new THREE.Vector3((-(size / 2 + offset * 2) * 1) / this.sceneCSSScale, 50, 50)
      }

      this.createPlane(
        size,
        '#00ff00',
        pos,
        new THREE.Euler(0, THREE.Math.degToRad(-90), 0),
        this.htmlDivs[i],
      )
    }

    this.sceneCSS.add(this.graphParent)

    this.cubeOriginPosition = this.cube.position.clone()
    this.cubeOriginRotation = this.cube.rotation.clone()

    this.cubeParent.add(this.cube)

    this.scene.add(this.cubeParent)
  }

  createPlane(size, cssColor, pos, rot, htmlDiv) {
    // check how to fix bug on chrome
    const div = document.createElement('div')
    div.style.width = `${(size + 600) / this.sceneCSSScale}px`
    div.style.height = `${(size + 40) / this.sceneCSSScale}px`
    div.style.fontSize = `${(size / 2) / this.sceneCSSScale}px`

    div.classList.add('cube__text')
    div.innerHTML = htmlDiv.text
    htmlDiv.wrapper = div

    const object = new CSS3DObject(div)
    object.position.copy(pos)
    object.rotation.copy(rot)

    object.position.x -= 70 // offset to put the text a little bit in front of the cube's face

    // use this object as a pivot point
    const plane = new THREE.Object3D()
    plane.add(object)

    this.graphParent.add(plane)

    this.graphs.push(plane)

    this.graphOriginRotation = plane.rotation.clone()
  }

  initCircle() {
    const size = 22
    const geometry = new THREE.BoxBufferGeometry(size, size, size)
    const color = new THREE.Color(...this.circleColor)
    this.circleMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 })
    this.circle = new THREE.Mesh(geometry, this.circleMaterial)
    this.cube.add(this.circle)
  }

  startTransition(axis) {
    this.targetGraphRotateY = 0
    this.targetGraphRotateZ = 0
    switch (axis) {
      default:
        // phase 1 rotation
        this.targetCubeRotateY = THREE.Math.degToRad(0) + this.offsetCubeRotY
        this.targetCubeRotateZ = THREE.Math.degToRad(0)

        this.targetGraphRotateY = THREE.Math.degToRad(90)
        this.targetGraphRotateZ = THREE.Math.degToRad(-90)
        break
      case 'y':
        // phase 2 rotation
        this.targetCubeRotateY = THREE.Math.degToRad(-90) + this.offsetCubeRotY
        this.targetGraphRotateY = THREE.Math.degToRad(-90)
        break
      case 'z':
        // phase 3 rotation
        this.targetCubeRotateZ = THREE.Math.degToRad(90)
        this.targetGraphRotateZ = THREE.Math.degToRad(90)
        break
    }

    this.axisRotate = axis

    let lastPhase = this.phase - 1
    if (lastPhase < 0) {
      lastPhase = this.shapes.length - 1
    }
    // morph target
    this.cubeOriginGeometry = this.shapes[lastPhase].children[0].geometry
    this.cubeTargetGeometry = this.shapes[this.phase].children[0].geometry

    this.startAnimation = getNow()
    this.transitionStarted = true
  }

  toggleStyle = () => {
    // this.showCircleStarted = true
    // this.startAnimationCircle = getNow()

    // if (this.showDot === true) {
    //   this.elem.classList.remove('show-dot')
    //   this.showDot = false
    //   this.circleOpacity = 1
    //   this.circleOpacityTarget = 0
    //   this.circleScale = 1
    //   this.circleScaleTarget = 0.01 // not 0 to avoid three js scale issues
    // } else {
    //   this.circleOpacity = 0
    //   this.circleOpacityTarget = 1
    //   this.elem.classList.add('show-dot')
    //   this.circleScale = 0.01
    //   this.circleScaleTarget = 1
    //   this.showDot = true
    // }
  }

  setUnits() {
    this.width = this.ui.container.clientWidth
    this.height = this.ui.container.clientHeight
  }

  handleMouseMove = e => {
    const { x, y } = e.detail

    this.mouse.x = (x / window.innerWidth) * 2 - 1
    this.mouse.y = (y / window.innerHeight) * 2 - 1
  }

  handleRAF = e => {
    const { now } = e.detail

    if (this.started) {
      this.renderer.render(this.scene, this.camera)
      this.rendererCSS.render(this.sceneCSS, this.camera)

      if (this.transitionStarted) {
        this.changeCircleColor(now)
        this.rotateOnOneSide(now)
        this.morph(now)
      }

      if (this.showCircleStarted) {
        this.animateCircle(now)
      }

      this.mouseRotation()
    }
  }

  animateCircle(now) {
    // opacity
    const percent = (now - this.startAnimationCircle) / this.durationCircleAppear
    const opacity = this.circleOpacity + (this.circleOpacityTarget - this.circleOpacity) * outExpo(percent)
    if (percent < 1) {
      this.circleMaterial.opacity = opacity
      // this.circleMaterial.needsUpdate = true
    }

    // scale
    const percentScale = (now - this.startAnimationCircle) / this.durationCircleScale
    const scale = this.circleScale + (this.circleScaleTarget - this.circleScale) * outExpo(percentScale)
    // const roundValue = 1000
    // scale = Math.round(scale * roundValue) / roundValue

    if (percentScale < 1) {
      this.circle.scale.set(scale, scale, scale)
    } else {
      this.showCircleStarted = false
    }
  }

  changeCircleColor(now) {
    const percent = (now - this.startAnimation) / this.durationRotate

    this.circleColor[0] += (this.targetColor[0] - this.circleColor[0]) * outExpo(percent)
    this.circleColor[1] += (this.targetColor[1] - this.circleColor[1]) * outExpo(percent)
    this.circleColor[2] += (this.targetColor[2] - this.circleColor[2]) * outExpo(percent)

    this.circleMaterial.color.setRGB(this.circleColor[0], this.circleColor[1], this.circleColor[2])
  }

  rotateOnOneSide(now) {
    const percent = (now - this.startAnimation) / this.durationRotate
    const cubeProgressY =
      this.cubeOriginRotation.y + (this.targetCubeRotateY - this.cubeOriginRotation.y) * outExpo(percent)
    const cubeProgressZ =
      this.cubeOriginRotation.z + (this.targetCubeRotateZ - this.cubeOriginRotation.z) * outExpo(percent)
    // move current graph away
    const graphProgressY = this.targetGraphRotateY * outExpo(percent)
    const graphProgressZ = this.targetGraphRotateZ * outExpo(percent)
    // move next graph in front
    const nextGraphProgressY =
      this.graphOriginRotations[this.phase].y +
      (THREE.Math.degToRad(0) - this.graphOriginRotations[this.phase].y) * outExpo(percent)
    const nextGraphProgressZ =
      this.graphOriginRotations[this.phase].z +
      (THREE.Math.degToRad(0) - this.graphOriginRotations[this.phase].z) * outExpo(percent)
    // const graphProgress = this.targetGraphRotate * outExpo(percent)
    let lastPhase = this.phase - 1
    if (lastPhase < 0) {
      lastPhase = this.shapes.length - 1
    }

    this.cube.rotation.y = cubeProgressY
    this.cube.rotation.z = cubeProgressZ

    this.graphs[lastPhase].rotation.y = graphProgressY
    this.graphs[lastPhase].rotation.z = graphProgressZ

    this.graphs[this.phase].rotation.y = nextGraphProgressY
    this.graphs[this.phase].rotation.z = nextGraphProgressZ

    if (percent > 1) {
      // end of animation
      this.transitionStarted = false
      // reset graph rotation
      this.graphs[lastPhase].rotation.copy(this.graphOriginRotations[lastPhase])

      this.cubeOriginRotation = this.cube.rotation.clone()
    }
  }

  mouseRotation() {
    this.mouseAngleZ += (THREE.Math.degToRad(this.mouse.y * this.mouseMaxAngle) - this.mouseAngleZ) * this.mouseDelay
    this.mouseAngleY += (THREE.Math.degToRad(this.mouse.x * this.mouseMaxAngle) - this.mouseAngleY) * this.mouseDelay

    this.cubeParent.rotation.y = this.mouseAngleY
    this.cubeParent.rotation.z = this.mouseAngleZ

    this.graphParent.rotation.copy(this.cubeParent.rotation)
  }

  morph(now) {
    const { position } = this.cube.geometry.attributes

    for (let i = 0; i < position.count; i++) {
      const percent = (now - this.startAnimation) / this.durationMorph

      const { position: targetPosition } = this.cubeTargetGeometry.attributes
      const { position: originPosition } = this.cubeOriginGeometry.attributes
      const x = originPosition.getX(i) + (targetPosition.getX(i) - originPosition.getX(i)) * outElastic(percent)
      const y = originPosition.getY(i) + (targetPosition.getY(i) - originPosition.getY(i)) * outElastic(percent)
      const z = originPosition.getZ(i) + (targetPosition.getZ(i) - originPosition.getZ(i)) * outElastic(percent)
      position.setXYZ(i, x, y, z)
    }
  }

  handleResize = () => {
    this.setUnits()
    // Update camera
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    // Update canvas size
    // extends the scene from his container
    this.renderer.setSize(this.width * this.extendCoef, this.height * this.extendCoef)
    this.rendererCSS.setSize(this.width, this.height)
  }
}

const cube = () => {
  const el = document.querySelector('[data-cube]')
  // init only if we need to
  if (el) {
    new Cube(el)
  }
}

export default cube
