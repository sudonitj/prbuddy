
function doStuff(input) {
  for (var i = 0; i < input.length; i++) {
    if (input[i] == "bad") {
      return true
    }
  }
  return false
}

