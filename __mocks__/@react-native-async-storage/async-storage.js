// Simple inline mock for @react-native-async-storage/async-storage
const AsyncStorage = {
  getItem:     jest.fn().mockResolvedValue(null),
  setItem:     jest.fn().mockResolvedValue(null),
  removeItem:  jest.fn().mockResolvedValue(null),
  clear:       jest.fn().mockResolvedValue(null),
  getAllKeys:   jest.fn().mockResolvedValue([]),
  multiGet:    jest.fn().mockResolvedValue([]),
  multiSet:    jest.fn().mockResolvedValue(null),
  multiRemove: jest.fn().mockResolvedValue(null),
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
