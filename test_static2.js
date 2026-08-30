const { staticFile } = require('remotion');
const path = "/public/channels/Chrono-Fi/The Disturbing History of ROLEX/assets/4297402_dark-smoke.mp4";
const replaced = path.replace(/^\/?public\//, '');
console.log("Original:", path);
console.log("Replaced:", replaced);
console.log("Static:", staticFile(replaced));
