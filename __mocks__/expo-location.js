export const requestForegroundPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const getCurrentPositionAsync = jest.fn().mockResolvedValue({ coords: { latitude: 22.5726, longitude: 88.3639 } });
export const Accuracy = { Balanced: 3 };
