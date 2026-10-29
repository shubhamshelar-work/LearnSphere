// utils/shuffle.js
// Fisher-Yates shuffle. Returns a new array; the input is not mutated.

function shuffleArray(input) {
  const array = Array.isArray(input) ? input.slice() : []
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

module.exports = { shuffleArray }
