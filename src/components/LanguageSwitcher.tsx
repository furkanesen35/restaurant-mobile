import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES, LanguageCode } from '../i18n/languages';
import { useTranslation } from '../hooks/useTranslation';

interface LanguageSwitcherProps {
  iconColor?: string;
  iconSize?: number;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  iconColor = '#e0b97f',
  iconSize = 24 
}) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  const handleOpenModal = () => {
    setShowModal(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleCloseModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowModal(false));
  };

  const handleSelectLanguage = async (languageCode: LanguageCode) => {
    try {
      await changeLanguage(languageCode);
      handleCloseModal();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <>
      {/* Language Switcher Button */}
      <TouchableOpacity 
        style={styles.languageButton} 
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Ionicons name="language" size={iconSize} color={iconColor} />
        <Text style={styles.languageButtonText}>{t('profile.language')}</Text>
        <View style={styles.languageFlag}>
          <Text style={styles.flagEmoji}>{LANGUAGES[currentLanguage].flag}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('language.selectLanguage')}</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={28} color="#2d2117" />
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {Object.entries(LANGUAGES).map(([code, language]) => {
                const isSelected = currentLanguage === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.languageOption,
                      isSelected && styles.languageOptionSelected,
                    ]}
                    onPress={() => handleSelectLanguage(code as LanguageCode)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageOptionLeft}>
                      <Text style={styles.languageFlag}>{language.flag}</Text>
                      <View>
                        <Text style={styles.languageName}>{language.nativeName}</Text>
                        <Text style={styles.languageCode}>({code.toUpperCase()})</Text>
                      </View>
                    </View>
                    
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#e0b97f" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2d2117',
    marginLeft: 12,
    fontWeight: '500',
  },
  languageFlag: {
    marginRight: 8,
  },
  flagEmoji: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fffbe8',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d2117',
  },
  languageList: {
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    borderColor: '#e0b97f',
    backgroundColor: '#fff9e8',
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2117',
    marginLeft: 12,
  },
  languageCode: {
    fontSize: 12,
    color: '#999',
    marginLeft: 12,
  },
  closeButton: {
    backgroundColor: '#e0b97f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d2117',
  },
});

export default LanguageSwitcher;
