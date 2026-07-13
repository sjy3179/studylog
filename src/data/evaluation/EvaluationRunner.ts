import type { TmPosePredictionResult } from '@/ai/tm-pose/tm-pose-types'
import type { EvaluationCameraDistance, EvaluationLightingCondition, EvaluationRecord } from '@/data/evaluation/evaluation-types'
import { createRecordId } from '@/data/session/session-data-config'
import type { TmPoseLabel } from '@/types/study'

const LABELS: TmPoseLabel[]=['GOOD_POSTURE','FORWARD_LEAN','SIDE_LEAN','RESTING']
export interface EvaluationContext { participantCode:string;actualLabel:TmPoseLabel;modelVersion:string;mirrorCamera:boolean;lightingCondition:EvaluationLightingCondition;cameraDistance:EvaluationCameraDistance;environmentNote:string;startedAtMs:number;endedAtMs:number }
export class EvaluationRunner {
  build(context:EvaluationContext,predictions:TmPosePredictionResult[],_nowMs:number):EvaluationRecord {
    const unique=[...new Map(predictions.filter((prediction)=>
      prediction.timestampMs>=context.startedAtMs&&
      prediction.timestampMs<=context.endedAtMs&&
      LABELS.every((label)=>Number.isFinite(prediction.probabilities[label])&&prediction.probabilities[label]>=0&&prediction.probabilities[label]<=1),
    ).map((prediction)=>[prediction.timestampMs,prediction])).values()]
    if(unique.length<5) throw new Error('유효한 자세 예측이 충분하지 않습니다.')
    const averages=Object.fromEntries(LABELS.map((label)=>[label,unique.reduce((n,p)=>n+p.probabilities[label],0)/unique.length])) as Record<TmPoseLabel,number>
    const predictedLabel=[...LABELS].sort((a,b)=>averages[b]-averages[a]||LABELS.indexOf(a)-LABELS.indexOf(b))[0]
    return {schemaVersion:1,id:createRecordId('evaluation'),createdAtIso:new Date().toISOString(),participantCode:context.participantCode,actualLabel:context.actualLabel,predictedLabel,correct:predictedLabel===context.actualLabel,averageConfidence:averages[predictedLabel],averageGoodProbability:averages.GOOD_POSTURE,averageForwardProbability:averages.FORWARD_LEAN,averageSideProbability:averages.SIDE_LEAN,averageRestingProbability:averages.RESTING,validSampleCount:unique.length,rejectedSampleCount:predictions.length-unique.length,collectionDurationMs:context.endedAtMs-context.startedAtMs,modelVersion:context.modelVersion,mirrorCamera:context.mirrorCamera,lightingCondition:context.lightingCondition,cameraDistance:context.cameraDistance,environmentNote:context.environmentNote}
  }
}
