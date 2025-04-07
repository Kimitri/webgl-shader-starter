// WebGL-konteksti ja piirtoalue
let gl = null; // WebGL-konteksti
let canvas = null; // Piirtoalue
let shaderProgram; // Shader-ohjelma, joka välitetään GPU:lle

// Perustiedot
let startTime = new Date().getTime(); // Aloitusaika
let aspectRatio; // Piirtoalueen (ikkunan) kuvasuhde

// Verteksitiedot
let vertexArray; // Verteksitaulukko
let vertexBuffer; // Verteksipuskuri, joka välitetään GPU:lle
let vertexNumComponents = 2; // Verteksin komponenttien määrä (x, y)

// Shaderille välitettävät tiedot (uniformit ja attribuutit)
let uGlobalColor; // Piirtoväri
let uElapsed; // Kulunut aika
let uViewport; // Piirtoalueen ulottuvuudet
let aVertexPosition; // Verteksien sijainti shaderissa


/**
 * WebGL:n alustus ja shaderien kääntäminen
 */
function start() {
  canvas = document.querySelector("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false });
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const shaderSet = [
    { type: gl.VERTEX_SHADER, id: "vertex-shader" },
    { type: gl.FRAGMENT_SHADER, id: "fragment-shader" }
  ];

  shaderProgram = buildShaderProgram(shaderSet);
  gl.useProgram(shaderProgram);

  aspectRatio = canvas.width / canvas.height;

  // Verteksipisteiden koordinaatit (kaksi kolmiota)
  vertexArray = new Float32Array([
    -1.0, 1.0,
    1.0, 1.0,
    1.0, -1.0,

    -1.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0
  ]);

  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

  animate();
}


/**
 * Shader-ohjelman rakentaminen ja linkitys
 *
 * @param {Array} shaderInfo - Taulukko shaderin tiedoista
 *
 * @return {WebGLProgram} - Shader-ohjelma
 */
function buildShaderProgram(shaderInfo) {
  let program = gl.createProgram();
  shaderInfo.forEach(info => {
    let shader = compileShader(info.id, info.type);
    if (shader) {
      gl.attachShader(program, shader);
    }
  });

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Shaderin linkitys epäonnistui: ", gl.getProgramInfoLog(program));
    return null;
  }

  return program;
}


/**
 * Shaderin kääntäminen
 *
 * @param {string} id - Shader-elementin ID HTML:ssä
 * @param {number} type - Shaderin tyyppi (VERTEX_SHADER tai FRAGMENT_SHADER)
 *
 * @return {WebGLShader} - Käännetty shader
 */
function compileShader(id, type) {
  let code = document.getElementById(id).textContent;
  let shader = gl.createShader(type);

  gl.shaderSource(shader, code);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shaderin käännös epäonnistui: ", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


/**
 * Yhden animaatioframen piirtäminen
 */
function animate() {
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Asetetaan uniformit
  uGlobalColor = gl.getUniformLocation(shaderProgram, "uGlobalColor");
  uElapsed = gl.getUniformLocation(shaderProgram, "uElapsed");
  uViewport = gl.getUniformLocation(shaderProgram, "uViewport");

  gl.uniform4fv(uGlobalColor, [1.0, 1.0, 1.0, 1.0]);
  gl.uniform2fv(uViewport, [canvas.width, canvas.height]);
  gl.uniform1f(uElapsed, (new Date().getTime() - startTime) / 1000.0);

  // Sidotaan verteksipuskuri ja asetetaan verteksiattribuutit
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(aVertexPosition);
  gl.vertexAttribPointer(aVertexPosition, vertexNumComponents, gl.FLOAT, false, 0, 0);

  // Piirretään kolmiot
  gl.drawArrays(gl.TRIANGLES, 0, vertexArray.length / vertexNumComponents);

  window.requestAnimationFrame(animate); // Pyydetään seuraavaa animaatioframea
}


// Tarvittavat event listenerit
window.addEventListener("load", start, false);
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
