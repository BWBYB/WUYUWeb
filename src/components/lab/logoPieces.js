import { PIECES as ASCII_REST_PIECES } from './asciiRestPieces'
import { PIECES as STACK_PIECES } from './stackPieces'

const pieces = Object.fromEntries([
  ...ASCII_REST_PIECES.map((piece) => [piece.id, { ...piece, source: 'ascii.rest' }]),
  ...STACK_PIECES.map((piece) => [piece.id, piece]),
])

export const PIECES = [
  pieces.javascript,
  pieces.typescript,
  pieces.html,
  pieces.css,
  pieces.react,
  pieces.vue,
  pieces.tailwind,
  pieces.three,
  pieces.node,
  pieces.vite,
  pieces.java,
  pieces.python,
  pieces.mysql,
  pieces.docker,
  pieces.git,
  pieces.wechat,
  pieces.cpp,
]
