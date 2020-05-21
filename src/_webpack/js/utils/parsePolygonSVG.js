export default function parsePolygonSVG(points) {
  const coordinates = points.split(' ')

  const parsedCoordinates = []
  coordinates.forEach(xy => {
    const x = xy.split(',')[0]
    const y = xy.split(',')[1]
    if (x && y) { // check if not empty values
      parsedCoordinates.push({
        x: parseFloat(x),
        y: parseFloat(y),
      })
    }
  })

  return parsedCoordinates
}
