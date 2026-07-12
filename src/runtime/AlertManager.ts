import { DEFAULT_ALERT_CONFIG, type AlertConfig } from '@/runtime/runtime-config'
import type { RuntimeAlertEvent, StablePostureSnapshot } from '@/runtime/runtime-types'
import type { LuxStatus, SessionLifecycle } from '@/types/study'

const POSTURE_MESSAGES = {
  FORWARD_LEAN: '상체가 기준 자세보다 앞으로 이동한 상태가 지속되고 있습니다. 자세를 잠시 확인해 주세요.',
  SIDE_LEAN: '몸이 한쪽으로 기울어진 상태가 지속되고 있습니다. 편안한 자세로 다시 앉아 주세요.',
  RESTING: '휴식 자세가 일정 시간 지속되고 있습니다. 필요하다면 잠시 쉬었다가 다시 시작해 주세요.',
  BASELINE_DEVIATION: '현재 자세가 등록한 기준 자세에서 크게 벗어났습니다. 자세를 다시 확인해 주세요.',
} as const

export class AlertManager {
  private badSinceMs: number | null = null
  private lastPostureAlertMs: number | null = null
  private lastLuxAlertMs: number | null = null

  constructor(private readonly config: AlertConfig = DEFAULT_ALERT_CONFIG) {}

  update(input: {
    nowMs: number
    lifecycle: SessionLifecycle
    posture: StablePostureSnapshot
    luxStatus: LuxStatus
    runtimeReady: boolean
    enabled: boolean
  }): RuntimeAlertEvent[] {
    const events: RuntimeAlertEvent[] = []
    if (!input.enabled || !input.runtimeReady || input.lifecycle !== 'RUNNING' || input.posture.state === 'AWAY' || input.posture.state === 'UNKNOWN') {
      this.badSinceMs = null
      return events
    }

    if (input.posture.state === 'BAD') {
      this.badSinceMs ??= input.nowMs
      const heldLongEnough = input.nowMs - this.badSinceMs >= this.config.postureHoldMs
      const cooldownDone = this.lastPostureAlertMs === null || input.nowMs - this.lastPostureAlertMs >= this.config.postureCooldownMs
      if (heldLongEnough && cooldownDone && input.posture.badReason) {
        this.lastPostureAlertMs = input.nowMs
        events.push({
          type: 'POSTURE',
          timestampMs: input.nowMs,
          title: '자세를 확인해 주세요',
          message: POSTURE_MESSAGES[input.posture.badReason],
          badReason: input.posture.badReason,
        })
      }
    } else {
      this.badSinceMs = null
    }

    if (input.luxStatus === 'DARK' || input.luxStatus === 'TOO_BRIGHT') {
      const cooldownDone = this.lastLuxAlertMs === null || input.nowMs - this.lastLuxAlertMs >= this.config.luxCooldownMs
      if (cooldownDone) {
        this.lastLuxAlertMs = input.nowMs
        events.push({
          type: input.luxStatus === 'DARK' ? 'LUX_DARK' : 'LUX_TOO_BRIGHT',
          timestampMs: input.nowMs,
          title: input.luxStatus === 'DARK' ? '주변이 너무 어둡습니다' : '주변이 지나치게 밝습니다',
          message: input.luxStatus === 'DARK'
            ? '스탠드를 켜 학습 공간의 밝기를 조절해 주세요.'
            : '화면이나 책상에 강한 반사가 없는지 확인해 주세요.',
          badReason: null,
        })
      }
    }
    return events
  }

  reset(): void {
    this.badSinceMs = null
    this.lastPostureAlertMs = null
    this.lastLuxAlertMs = null
  }
}
