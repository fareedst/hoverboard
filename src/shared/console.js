// for pages that have a console (tab, background)
// not for browser action popup page

function dir(obj) {
  console.dir(obj)
}

function log() {
  const args = Array.prototype.map.call(
    arguments,
    arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
  )
  console.log(Array.prototype.join.call(args, ' '))
  // var p = document.createElement('pre');
  // p.appendChild(
  //   document.createTextNode(
  //     Array.prototype.join.call(arguments, " ")
  //   )
  // );
  // document.body.appendChild(p);
}
