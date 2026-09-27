import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendChart } from '@/features/dashboard/components/TrendChart'

const points = [
  { label: '01.09', value: 100 },
  { label: '02.09', value: 0 },
  { label: '03.09', value: 250 },
]

describe('TrendChart', () => {
  it('should expose an accessible image with the given label', () => {
    render(<TrendChart points={points} ariaLabel="Încasări pe zi" />)

    expect(screen.getByRole('img', { name: 'Încasări pe zi' })).toBeInTheDocument()
  })

  it('should draw one bar per point in bar mode, including zero days', () => {
    const { container } = render(<TrendChart variant="bar" points={points} ariaLabel="Programări" />)

    expect(container.querySelectorAll('rect')).toHaveLength(3)
  })

  it('should render without crashing when the series is empty', () => {
    const { container } = render(<TrendChart points={[]} ariaLabel="Gol" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelectorAll('circle')).toHaveLength(0)
  })
})
