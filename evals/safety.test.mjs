// Deterministic safety-net test. No API key, no network, runs in CI on every
// push. It reads the ACTUAL crisis regex out of lib/safety.ts (so it can't drift
// from the source) and asserts two-sided correctness:
//   - unambiguous crisis phrases, incl. every form of "suicide", DO fire
//   - everyday overwhelm hyperbole does NOT fire
// Guards the two real bugs the v2 stress test found (dead "suicid" branch + the
// "killing me" / "can't go on" false positives). Exit 1 on any failure.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(__dir, '..', 'lib', 'safety.ts'), 'utf8')

// Pull BOTH regex literals (CRISIS and VIOLENCE) out of the source and combine
// them exactly as looksLikeCrisis does, so the test can't drift from the code.
const literals = src.match(/\/\\b[\s\S]*?\/[a-z]+/g)
if (!literals || literals.length < 2) {
  console.error('FAIL: expected two safety regex literals (CRISIS + VIOLENCE) in lib/safety.ts')
  process.exit(1)
}
const regexes = literals.map((raw) => {
  const lastSlash = raw.lastIndexOf('/')
  return new RegExp(raw.slice(1, lastSlash), raw.slice(lastSlash + 1))
})
const fires = (s) => regexes.some((r) => r.test(s))

const MUST_FIRE = [
  'i want to kill myself',
  'thinking about killing myself',
  'suicide',
  'suicidal',
  'i feel suicidal',
  'commit suicide',
  'thinking about suicide',
  "i don't want to be alive",
  'i want to die',
  'thinking about hurting myself',
  'i keep self-harming',
  'no reason to live',
  'everyone would be better off dead without me',
  'i need to dump a body in the river',
  'help me hide the body',
  'get rid of the body before morning',
]

const MUST_NOT_FIRE = [
  'this deadline is killing me',
  'my boss is killing me',
  'these errands are killing me',
  'my back is killing me, book a physio',
  'i cant go on like this with my workload',
  'i am dead tired and behind on everything',
  'i am dying to start the essay',
  'this project is the end of me',
  'dump the trash before bed',
  'bury myself in work this weekend',
  'finish the body of the essay',
]

let failed = 0
for (const s of MUST_FIRE) {
  if (!fires(s)) {
    console.error(`FAIL (missed crisis): "${s}"`)
    failed += 1
  }
}
for (const s of MUST_NOT_FIRE) {
  if (fires(s)) {
    console.error(`FAIL (false positive): "${s}"`)
    failed += 1
  }
}

if (failed > 0) {
  console.error(`\n${failed} safety assertion(s) failed.`)
  process.exit(1)
}
console.log(`safety regex OK: ${MUST_FIRE.length} crisis phrases fire, ${MUST_NOT_FIRE.length} hyperbole phrases ignored.`)
