import test from 'node:test'
import assert from 'node:assert/strict'
import { optionsFromChildren } from './OptionSelect'

test('native <option> children become popover options, including mapped and conditional ones', () => {
  const extra = true
  const options = optionsFromChildren(<>
    <option value="">Select</option>
    {extra && <option value="no_pickup">Not picked up</option>}
    {['cancelled'].map((cause) => <option key={cause} value={cause}>{cause} · {2}</option>)}
    <option value="x" disabled>Locked</option>
  </>)
  assert.deepEqual(options, [
    { value: '', label: 'Select', disabled: undefined },
    { value: 'no_pickup', label: 'Not picked up', disabled: undefined },
    { value: 'cancelled', label: 'cancelled · 2', disabled: undefined },
    { value: 'x', label: 'Locked', disabled: true },
  ])
})
