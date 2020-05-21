export function oscillateBetween(value, min, max, frequence = 1) {
  const amplitude = max - min
  const average = amplitude / 2 + min
  return Math.sin(value * frequence) * amplitude / 2 + average
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min
}

export function toRadian(degrees) {
  return degrees * Math.PI / 180
}
