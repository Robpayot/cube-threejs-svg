/**
 * Guesses whether the device is touchEnabled: more specifically,
 * whether the primary device is a touch device.
 * @return {Boolean}
 */
export default function isTouchDevice() {
  if ('standalone' in navigator) {
    return true // iOS devices
  }

  const hasCoarse = window.matchMedia('(pointer: coarse)').matches
  if (hasCoarse) {
    return true // true-ish
  }

  const hasPointer = window.matchMedia('(pointer: fine)').matches
  if (hasPointer) {
    return false // prioritize mouse control
  }

  // Otherwise, fall-back to older style mechanisms.
  return (('ontouchstart' in window) ||
    (navigator.MaxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0))
}
