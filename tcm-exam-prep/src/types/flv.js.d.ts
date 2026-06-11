declare module 'flv.js' {
  interface FlvMediaSourceConfig {
    isLive?: boolean
    cors?: boolean
    withCredentials?: boolean
    hasAudio?: boolean
    hasVideo?: boolean
    type?: 'flv' | 'mp4'
    url: string
    segments?: {
      duration?: number
      filesize?: number
    }
  }

  interface FlvPlayerConfig {
    enableWorker?: boolean
    enableStashBuffer?: boolean
    stashInitialSize?: number
    isLive?: boolean
    lazyLoad?: boolean
    lazyLoadMaxDuration?: number
    lazyLoadRecoverDuration?: number
    deferLoadAfterSourceOpen?: boolean
    autoCleanupSourceBuffer?: boolean
    autoCleanupMaxBackwardDuration?: number
    autoCleanupMinBackwardDuration?: number
    statisticsInfoReportInterval?: number
    fixAudioTimestampGap?: boolean
    seekType?: 'range' | 'param' | 'custom'
    customSeekHandler?: (needSeekTime: number) => void
    headers?: Record<string, string>
  }

  class Player {
    constructor(mediaDataSource: FlvMediaSourceConfig, config?: FlvPlayerConfig)
    attachMediaElement(mediaElement: HTMLElement): void
    detachMediaElement(): void
    load(): void
    unload(): void
    play(): Promise<void>
    pause(): void
    destroy(): void
    readonly type: string
    readonly buffered: TimeRanges
    readonly duration: number
    readonly volume: number
    readonly muted: boolean
    readonly currentTime: number
    readonly mediaInfo: { [key: string]: unknown }
    readonly statisticsInfo: { [key: string]: unknown }
    currentTime: number
    volume: number
    muted: boolean
    on(event: string, listener: (...args: any[]) => void): void
    off(event: string, listener: (...args: any[]) => void): void
    readonly paused: boolean
  }

  interface FlvJs {
    isSupported(): boolean
    getFeatureList(): { mseFlvPlayback: boolean; mseLiveFlvPlayback: boolean; networkStreamIO: boolean; networkLoaderName: string; nativeMP4H264Playback: boolean; nativeWebmVP8Playback: boolean; nativeWebmVP9Playback: boolean }
    createPlayer(mediaDataSource: FlvMediaSourceConfig, config?: FlvPlayerConfig): Player
    createLivePlayer(mediaDataSource: FlvMediaSourceConfig, config?: FlvPlayerConfig): Player
    getMSEVersion(): string
    version: string
    LoggingControl: {
      getConfig(): { [key: string]: boolean }
      applyConfig(config: { [key: string]: boolean }): void
      addLogListener(listener: (type: string, str: string) => void): void
    }
    Events: {
      ERROR: string
      LOADING_COMPLETE: string
      RECOVERED_EARLY_EOF: string
      MEDIA_INFO: string
      METADATA_ARRIVED: string
      SCRIPTDATA_ARRIVED: string
      STATISTICS_INFO: string
      LOADED_SEI: string
    }
    ErrorTypes: {
      NETWORK_ERROR: string
      MEDIA_ERROR: string
      OTHER_ERROR: string
    }
    ErrorDetails: {
      NETWORK_EXCEPTION: string
      NETWORK_STATUS_CODE_INVALID: string
      NETWORK_TIMEOUT: string
      NETWORK_UNREACHABLE: string
      MEDIA_MSE_ERROR: string
      MEDIA_FORMAT_ERROR: string
      MEDIA_FORMAT_UNSUPPORTED: string
      MEDIA_CODEC_UNSUPPORTED: string
    }
  }

  const flvjs: FlvJs
  export default flvjs
}
