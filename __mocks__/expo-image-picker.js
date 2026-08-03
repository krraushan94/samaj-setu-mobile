export const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const launchImageLibraryAsync = jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file://test.jpg', type: 'image' }] });
export const MediaTypeOptions = { Images: 'Images', Videos: 'Videos', All: 'All' };
