import { Bug, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useStudySessionStore } from '@/stores/useStudyStore'

export function RuntimeDebugPanel() {
  const [open, setOpen] = useState(false)
  const mode = useStudySessionStore((state) => state.controlMode)
  const snapshot = useStudySessionStore((state) => state.runtimeSnapshot)

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <CollapsibleTrigger asChild>
        <Button className="min-h-11 w-full justify-between" variant="outline">
          <span className="flex items-center gap-2"><Bug aria-hidden="true" className="size-4" />Phase 4 런타임 디버그</span>
          <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 rounded-xl border bg-muted/30 p-4 text-xs">
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="text-muted-foreground">mode</dt><dd>{mode}</dd>
          <dt className="text-muted-foreground">runtime</dt><dd>{snapshot?.runtimeReady ? 'READY' : snapshot?.blockingReason ?? 'WAITING'}</dd>
          <dt className="text-muted-foreground">TM</dt><dd>{snapshot?.fusedObservation?.tmLabel ?? '-'} · {snapshot?.fusedObservation?.tmConfidence !== null && snapshot?.fusedObservation?.tmConfidence !== undefined ? `${Math.round(snapshot.fusedObservation.tmConfidence * 100)}%` : '-'}</dd>
          <dt className="text-muted-foreground">MediaPipe</dt><dd>{snapshot?.fusedObservation ? String(snapshot.fusedObservation.poseDetected) : '-'}</dd>
          <dt className="text-muted-foreground">freshness</dt><dd>{snapshot?.fusedObservation ? `MP ${snapshot.fusedObservation.mediaPipeFresh} · TM ${snapshot.fusedObservation.tmFresh}` : '-'}</dd>
          <dt className="text-muted-foreground">deviation</dt><dd>{snapshot?.fusedObservation?.deviationScore?.toFixed(3) ?? '-'}</dd>
          <dt className="text-muted-foreground">raw</dt><dd>{snapshot?.fusedObservation?.rawState ?? '-'}</dd>
          <dt className="text-muted-foreground">reason</dt><dd>{snapshot?.fusedObservation?.reasonCode ?? '-'}</dd>
          <dt className="text-muted-foreground">history</dt><dd className="break-words">{snapshot?.stablePosture.history.map((item) => item.rawState).join(' · ') || '-'}</dd>
          <dt className="text-muted-foreground">consensus</dt><dd>{snapshot?.stablePosture.consensusCount ?? 0} / 8</dd>
          <dt className="text-muted-foreground">candidate</dt><dd>{snapshot?.stablePosture.candidateState ?? '-'} · {Math.round(snapshot?.stablePosture.candidateDurationMs ?? 0)}ms</dd>
          <dt className="text-muted-foreground">stable posture</dt><dd>{snapshot?.stablePosture.state ?? '-'}</dd>
          <dt className="text-muted-foreground">stable lux</dt><dd>{snapshot?.stableLux.status ?? '-'}</dd>
          <dt className="text-muted-foreground">StudyStatus</dt><dd>{snapshot?.studyStatus ?? '-'}</dd>
          <dt className="text-muted-foreground">effective eligible</dt><dd>{snapshot ? String(snapshot.effectiveTimeEligible) : '-'}</dd>
        </dl>
      </CollapsibleContent>
    </Collapsible>
  )
}
