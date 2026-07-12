import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCamera } from '@/hooks/useCamera'

function CameraHarness() {
  const { start, status, videoRef } = useCamera()
  return (
    <div>
      <video
        ref={(node) => {
          videoRef.current = node
          if (node) {
            Object.defineProperty(node, 'readyState', {
              configurable: true,
              value: HTMLMediaElement.HAVE_METADATA,
            })
            Object.defineProperty(node, 'srcObject', {
              configurable: true,
              value: null,
              writable: true,
            })
          }
        }}
      />
      <button onClick={() => void start()}>start</button>
      <output>{status}</output>
    </div>
  )
}

describe('useCamera lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stops the active stream when its component unmounts', async () => {
    const stop = vi.fn()
    const track = {
      readyState: 'live',
      stop,
      getSettings: () => ({ deviceId: 'camera-a' }),
      addEventListener: vi.fn(),
    }
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
        enumerateDevices: vi.fn().mockResolvedValue([]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    const user = userEvent.setup()
    const view = render(<CameraHarness />)

    await user.click(screen.getByRole('button', { name: 'start' }))
    await waitFor(() => expect(screen.getByText('READY')).toBeTruthy())
    view.unmount()

    expect(stop).toHaveBeenCalledOnce()
  })
})
