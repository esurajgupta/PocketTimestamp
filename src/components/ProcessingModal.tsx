import React from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ProcessingModalProps {
  visible: boolean;
  title?: string;
  progress?: number; // 0–100
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({
  visible,
  title = 'Processing…',
  progress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Progress bar */}
          {typeof progress === 'number' ? (
            <>
              <View style={styles.progressBarWrap}>
                <View
                  style={[styles.progressBarFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </>
          ) : (
            <ActivityIndicator size="large" color="#4A90E2" />
          )}

          {/* Extra content for compression */}
          <Text style={styles.subText}>
            Please wait while we compress your video and optimize storage size.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default ProcessingModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  progressBarWrap: {
    width: '100%',
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    color: '#444',
  },
  subText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
});
