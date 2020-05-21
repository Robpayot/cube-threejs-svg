export function getOffsetTop(elem) {
  const bounds = elem.getBoundingClientRect()
  const bodyTop = window.scrollY || document.documentElement.scrollTop

  return bounds.top + bodyTop
}

export function getOffsetBottom(elem) {
  const bounds = elem.getBoundingClientRect()
  const bodyTop = window.scrollY || document.documentElement.scrollTop

  return bounds.bottom + bodyTop
}

export function getOffsetLeft(elem) {
  const bounds = elem.getBoundingClientRect()

  return bounds.left
}
