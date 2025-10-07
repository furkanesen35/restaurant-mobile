import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { LoadingProps } from '../../types';

const LoadingOverlay: React.FC<LoadingProps> = ({ visible, message = 'Loading...' }) => {
  return (
    <Portal>
      <Modal visible={visible} dismissable={false} contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#e0b97f" />
          <Text style={styles.message}>{message}</Text>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#2d2117',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  message: {
    color: '#fffbe8',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LoadingOverlay;