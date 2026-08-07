export const useAudioRecorder = jest.fn(() => ({
  prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
  record: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  uri: null,
}));

export const useAudioRecorderState = jest.fn(() => ({ isRecording: false, durationMillis: 0, canRecord: true }));

export const RecordingPresets = { HIGH_QUALITY: {}, LOW_QUALITY: {} };

export const requestRecordingPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted', granted: true });
export const getRecordingPermissionsAsync     = jest.fn().mockResolvedValue({ status: 'granted', granted: true });
export const setAudioModeAsync                = jest.fn().mockResolvedValue(undefined);
export const setIsAudioActiveAsync            = jest.fn().mockResolvedValue(undefined);
