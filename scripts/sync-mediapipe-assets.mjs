import { access, cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const sourceDirectory = path.join(
  projectRoot,
  'node_modules',
  '@mediapipe',
  'tasks-vision',
  'wasm',
)
const destinationDirectory = path.join(projectRoot, 'public', 'mediapipe', 'wasm')

try {
  await access(sourceDirectory)
} catch (error) {
  throw new Error(
    `MediaPipe WASM source was not found at ${sourceDirectory}. Run npm install first.`,
    { cause: error },
  )
}

try {
  await mkdir(path.dirname(destinationDirectory), { recursive: true })
  await rm(destinationDirectory, { force: true, recursive: true })
  await cp(sourceDirectory, destinationDirectory, { recursive: true })
  console.log(`MediaPipe WASM assets synced to ${destinationDirectory}`)
} catch (error) {
  throw new Error(
    `Failed to sync MediaPipe WASM assets to ${destinationDirectory}.`,
    { cause: error },
  )
}
