import { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from './Button';
import { Card } from './Card';
import { useTheme } from '@/providers/ThemeProvider';

interface PhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmPhoto: (imageUrl: string) => void;
}

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80',
  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
];

export function PhotoPickerModal({ visible, onClose, onConfirmPhoto }: PhotoPickerModalProps) {
  const theme = useTheme();
  const [selectedPhoto, setSelectedPhoto] = useState<string>(PRESET_PHOTOS[0]);
  const [loading, setLoading] = useState(false);

  const handleDone = () => {
    onConfirmPhoto(selectedPhoto);
    onClose();
  };

  const handleOpenCamera = async () => {
    try {
      setLoading(true);
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to capture photos.');
        setLoading(false);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Failed to open camera scanner.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = async () => {
    try {
      setLoading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Photo library access is required to select photos.');
        setLoading(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Failed to pick photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Attach Activity Photo</Text>
          <Text style={[styles.sub, { color: theme.secondary }]}>
            Scan/capture a photo or pick from gallery to confirm your activity.
          </Text>

          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedPhoto }} style={styles.previewImage} />
          </View>

          {/* Camera Scanner & Gallery Actions */}
          <View style={styles.cameraRow}>
            <Button
              label={loading ? "Opening..." : "📸 Open Camera / Scan"}
              onPress={handleOpenCamera}
              style={styles.cameraBtn}
            />
            <Button
              label="🖼️ Choose from Gallery"
              secondary
              onPress={handleOpenGallery}
              style={styles.cameraBtn}
            />
          </View>

          <Text style={[styles.pickerLabel, { color: theme.secondary }]}>OR CHOOSE PRESET SAMPLE</Text>
          <View style={styles.presetsRow}>
            {PRESET_PHOTOS.map((url, idx) => (
              <Pressable
                key={url}
                onPress={() => setSelectedPhoto(url)}
                style={[
                  styles.presetThumb,
                  { borderColor: selectedPhoto === url ? theme.text : theme.border },
                ]}
              >
                <Image source={{ uri: url }} style={styles.presetImage} />
                <Text style={[styles.presetNumber, { color: theme.text }]}>#{idx + 1}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Attach & Complete" onPress={handleDone} style={styles.btn} />
            <Button label="Cancel" secondary onPress={onClose} style={styles.btn} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 20,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraRow: {
    gap: 8,
    marginBottom: 14,
  },
  cameraBtn: {
    marginTop: 0,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  presetThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  presetNumber: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFF',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  actions: {
    gap: 8,
  },
  btn: {
    marginTop: 0,
  },
});
