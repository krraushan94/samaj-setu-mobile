import React from 'react';
import { Text } from 'react-native';
export const MaterialIcons = ({ name, ...props }) => React.createElement(Text, props, name);
export const Ionicons      = ({ name, ...props }) => React.createElement(Text, props, name);
export const FontAwesome   = ({ name, ...props }) => React.createElement(Text, props, name);
