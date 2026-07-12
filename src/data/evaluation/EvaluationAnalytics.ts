import type { EvaluationRecord } from '@/data/evaluation/evaluation-types'
import type { TmPoseLabel } from '@/types/study'
const LABELS:TmPoseLabel[]=['GOOD_POSTURE','FORWARD_LEAN','SIDE_LEAN','RESTING']
export class EvaluationAnalytics { summarize(records:EvaluationRecord[]){const matrix=Object.fromEntries(LABELS.map((actual)=>[actual,Object.fromEntries(LABELS.map((predicted)=>[predicted,0]))])) as Record<TmPoseLabel,Record<TmPoseLabel,number>>;for(const r of records)matrix[r.actualLabel][r.predictedLabel]++;const accuracy=records.length?records.filter((r)=>r.correct).length/records.length:null;return{total:records.length,accuracy,matrix,labels:LABELS}} }
