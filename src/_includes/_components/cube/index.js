import * as THREE from 'three'
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { outExpo, outElastic } from '_js/utils/ease'
import getNow from '_js/utils/time'
import * as dat from 'dat.gui'

import RAFManager from '_js/managers/RAFManager'
import MouseManager from '_js/managers/MouseManager'

import shape1 from '_assets/cube/shape-1.obj'
import shape2 from '_assets/cube/shape-2.obj'
import shape3 from '_assets/cube/shape-3.obj'

const COLORS = {
  black: 0x2c3e50,
  blue: [0.20, 0.59, 0.86],
  cyan: [0.10, 0.73, 0.61],
  green: [0.18, 0.8, 0.44],
}

const TEXTS = ['THREE.JS', 'SVG', 'MORPHING']

class Cube {
  constructor(elem) {
    this.elem = elem
    this.sceneCSSScale = 0.5
    this.normalDuration = 4000
    this.longDuration = 5000
    this.mouse = {
      x: 0,
      y: 0,
    }
    this.mouseAngleY = 0
    this.mouseAngleZ = 0
    this.mouseMaxAngle = 10
    this.mouseDelay = 0.1
    this.extendCoef = 1.3
    this.htmlDivs = [{ text: TEXTS[0] }, { text: TEXTS[1] }, { text: TEXTS[2] }]
    this.texts = []
    this.targetCubeRotateY = 0
    this.targetCubeRotateZ = 0
    this.angleY = 0
    this.angleZ = 0
    this.axisRotate = new THREE.Vector3(0, 0, 0)
    this.startAnimation = 0
    this.transitionStarted = false
    this.phase = 0
    this.offsetCubeRotY = THREE.Math.degToRad(90)

    this.shapes = [null, null, null]
    this.insideCubeColors = [COLORS.blue, COLORS.green, COLORS.cyan]
    this.insideCubeColor = [...COLORS.blue] // need to be a different reference than COLORS.green
    this.targetColor = [0, 0, 0]
    this.OBJLoader = new OBJLoader()
    this.cubeParent = new THREE.Object3D()
    this.textsParent = new THREE.Object3D()

    this.textsOriginRotations = [
      new THREE.Euler(0, THREE.Math.degToRad(-90), THREE.Math.degToRad(-90)),
      new THREE.Euler(0, THREE.Math.degToRad(90), 0),
      new THREE.Euler(0, THREE.Math.degToRad(0), THREE.Math.degToRad(-90)),
    ]

    this.ui = {
      container: this.elem.querySelector('.cube__inner'),
    }

    this.load()
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
    this.initGUI()

    this.setUnits()
    this.buildScene()
    this.buildRender()
    this.buildCamera()

    this.buildCube()
    this.buildInsideCube()
    this.elem.classList.add('transi-in')

    this.started = true
    this.events(true)

    this.htmlDivs[0].wrapper.classList.add('is-displayed')

    setTimeout(() => {
      this.loopPhases()
    }, 1000)
  }

  events(enable) {
    if (enable) {
      window.addEventListener('resize', this.handleResize)
      RAFManager.addItem(this.handleRAF)
      MouseManager.addItem(this.handleMouseMove)
    } else {
      window.removeEventListener('resize', this.handleResize)
      RAFManager.removeItem(this.handleRAF)
      MouseManager.removeItem(this.handleMouseMove)
    }
  }

  initGUI() {
    const gui = new dat.GUI()

    this.guiOpts = {
      big_cube_stroke: 4.7,
      small_cube_scale: 1,
    }

    gui.add(this.guiOpts, 'big_cube_stroke', 1, 20).onChange(this.handleGUI).name('Big cube stroke')
    gui.add(this.guiOpts, 'small_cube_scale', 0.0, 1.5).onChange(this.handleGUI).name('Small cube scale')
  }

  handleGUI = () => {
    this.cube.material.linewidth = this.guiOpts.big_cube_stroke
    this.cube.material.needsUpdate = true

    const scale = this.guiOpts.small_cube_scale
    this.insideCube.scale.set(scale, scale, scale)
  }

  loopPhases() {
    this.phase = 0

    let index = 0
    const mainDelay = this.normalDuration + 400

    const loop = () => {
      const nextIndex = index + 1 > 2 ? 0 : index + 1
      this.phase = nextIndex
      this.targetColor = this.insideCubeColors[nextIndex]
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

      this.htmlDivs[index].wrapper.classList.remove('is-displayed')
      this.htmlDivs[nextIndex].wrapper.classList.add('is-displayed')

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
    this.renderer.setPrecision(1)
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

  buildCube() {
    // edges
    const size = 100

    const lineMaterial = new THREE.LineBasicMaterial({
      color: COLORS.black,
      linewidth: this.guiOpts.big_cube_stroke,
    })

    const geometry = this.shapes[this.phase].children[0].geometry.clone() // clone() is very important here
    this.cube = new THREE.LineSegments(geometry, lineMaterial)
    this.cube.rotation.y = this.offsetCubeRotY
    this.cube.material = lineMaterial

    const offset = size / 7

    // create texts
    for (let i = 0; i < this.htmlDivs.length; i++) {
      let pos = new THREE.Vector3((-(size / 2 + offset) * 1) / this.sceneCSSScale, 25, 0)

      if (i === 1) {
        pos = new THREE.Vector3((-(size / 2 + offset * 2) * 1) / this.sceneCSSScale, 50, 50)
      }

      this.buildPlane(
        size,
        '#00ff00',
        pos,
        new THREE.Euler(0, THREE.Math.degToRad(-90), 0),
        this.htmlDivs[i],
      )
    }

    this.sceneCSS.add(this.textsParent)

    this.cubeOriginPosition = this.cube.position.clone()
    this.cubeOriginRotation = this.cube.rotation.clone()

    this.cubeParent.add(this.cube)

    this.scene.add(this.cubeParent)
  }

  buildPlane(size, cssColor, pos, rot, htmlDiv) {
    // check how to fix bug on chrome
    const div = document.createElement('div')
    div.style.width = `${(size + 600) / this.sceneCSSScale}px`
    div.style.height = `${(size + 40) / this.sceneCSSScale}px`
    div.style.fontSize = `${(size / 2.5) / this.sceneCSSScale}px`

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

    this.textsParent.add(plane)

    this.texts.push(plane)

    this.graphOriginRotation = plane.rotation.clone()
  }

  buildInsideCube() {
    const size = 40
    const nbTrianglePerFace = 6
    const geometry = new THREE.BoxBufferGeometry(size, size, size, nbTrianglePerFace, nbTrianglePerFace, nbTrianglePerFace)
    const color = new THREE.Color(...this.insideCubeColor)
    this.insideCubeMaterial = new THREE.MeshBasicMaterial({ color, transparent: false })
    this.insideCube = new THREE.Mesh(geometry, this.insideCubeMaterial)
    this.cube.add(this.insideCube)
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
      if (this.transitionStarted) {
        this.changeInsideCubeColor(now)
        this.rotateOnOneSide(now)
        this.morph(now)
      }

      this.mouseRotation()

      this.renderer.render(this.scene, this.camera)
      this.rendererCSS.render(this.sceneCSS, this.camera)
    }
  }

  changeInsideCubeColor(now) {
    const percent = (now - this.startAnimation) / this.durationRotate

    this.insideCubeColor[0] += (this.targetColor[0] - this.insideCubeColor[0]) * outExpo(percent)
    this.insideCubeColor[1] += (this.targetColor[1] - this.insideCubeColor[1]) * outExpo(percent)
    this.insideCubeColor[2] += (this.targetColor[2] - this.insideCubeColor[2]) * outExpo(percent)

    this.insideCubeMaterial.color.setRGB(this.insideCubeColor[0], this.insideCubeColor[1], this.insideCubeColor[2])
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
      this.textsOriginRotations[this.phase].y +
      (THREE.Math.degToRad(0) - this.textsOriginRotations[this.phase].y) * outExpo(percent)
    const nextGraphProgressZ =
      this.textsOriginRotations[this.phase].z +
      (THREE.Math.degToRad(0) - this.textsOriginRotations[this.phase].z) * outExpo(percent)
    // const graphProgress = this.targetGraphRotate * outExpo(percent)
    let lastPhase = this.phase - 1
    if (lastPhase < 0) {
      lastPhase = this.shapes.length - 1
    }

    this.cube.rotation.y = cubeProgressY
    this.cube.rotation.z = cubeProgressZ

    this.texts[lastPhase].rotation.y = graphProgressY
    this.texts[lastPhase].rotation.z = graphProgressZ

    this.texts[this.phase].rotation.y = nextGraphProgressY
    this.texts[this.phase].rotation.z = nextGraphProgressZ

    if (percent > 1) {
      // end of animation
      this.transitionStarted = false
      // reset graph rotation
      this.texts[lastPhase].rotation.copy(this.textsOriginRotations[lastPhase])

      this.cubeOriginRotation = this.cube.rotation.clone()
    }
  }

  mouseRotation() {
    this.mouseAngleZ += (THREE.Math.degToRad(this.mouse.y * this.mouseMaxAngle) - this.mouseAngleZ) * this.mouseDelay
    this.mouseAngleY += (THREE.Math.degToRad(this.mouse.x * this.mouseMaxAngle) - this.mouseAngleY) * this.mouseDelay

    this.cubeParent.rotation.y = this.mouseAngleY
    this.cubeParent.rotation.z = this.mouseAngleZ

    this.textsParent.rotation.copy(this.cubeParent.rotation)
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
