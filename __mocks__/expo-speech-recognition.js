export const ExpoSpeechRecognitionModule = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
};

export const useSpeechRecognitionEvent = jest.fn();
