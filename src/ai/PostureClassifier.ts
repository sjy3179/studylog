export interface PostureClassifierInput {
  mirrorCamera: boolean
  timestampMs: number
  video: HTMLVideoElement
}

/** Shared lifecycle contract for the deterministic Mock and browser AI adapters. */
export interface PostureClassifier<TInput, TResult, TStatus, TModelInfo> {
  initialize(): Promise<void>
  predict(input: TInput): Promise<TResult>
  getStatus(): TStatus
  getModelInfo(): TModelInfo | null
  dispose(): Promise<void> | void
}
