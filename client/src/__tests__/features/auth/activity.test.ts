import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ACTIVITY_EVENT, trackUserActivity } from '@/features/auth/activity'

describe('trackUserActivity', () => {
  let untrack: () => void
  const onActivity = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    onActivity.mockClear()
    window.addEventListener(ACTIVITY_EVENT, onActivity)
    untrack = trackUserActivity()
    document.body.innerHTML = `
      <div id="plain"><span id="text">text</span></div>
      <button id="btn"><svg id="icon"></svg></button>
      <select id="sel"><option value="a">a</option></select>
      <div role="row" id="row"><div id="cell">x</div></div>
    `
  })

  afterEach(() => {
    untrack()
    window.removeEventListener(ACTIVITY_EVENT, onActivity)
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  const click = (id: string) =>
    document.getElementById(id)!.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  it('should report activity when a button is clicked, including its icon', () => {
    click('icon')
    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('should report activity when a grid row is clicked', () => {
    click('cell')
    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('should not report activity when a non-interactive area is clicked', () => {
    click('text')
    expect(onActivity).not.toHaveBeenCalled()
  })

  it('should report activity when a filter select changes', () => {
    document.getElementById('sel')!.dispatchEvent(new Event('change', { bubbles: true }))
    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('should report activity on keydown', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('should not report activity on mouse move or scroll', () => {
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    document.dispatchEvent(new Event('scroll'))
    expect(onActivity).not.toHaveBeenCalled()
  })

  it('should throttle rapid interactions', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))
    expect(onActivity).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1_000)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }))
    expect(onActivity).toHaveBeenCalledTimes(2)
  })

  it('should stop reporting after untrack', () => {
    untrack()
    click('btn')
    expect(onActivity).not.toHaveBeenCalled()
    untrack = () => {}
  })
})
