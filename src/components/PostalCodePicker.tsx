import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { AllowedPostalCode } from "../types";

type PostalCodePickerProps = {
  value: string;
  onSelect: (postalCode: string) => void;
  postalCodes: AllowedPostalCode[];
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  modalTitle?: string;
  closeLabel?: string;
  emptyLabel?: string;
};

const PostalCodePicker: React.FC<PostalCodePickerProps> = ({
  value,
  onSelect,
  postalCodes,
  label = "Postal Code",
  placeholder = "Select postal code",
  helperText,
  errorText,
  disabled,
  modalTitle = "Select Postal Code",
  closeLabel = "Close",
  emptyLabel = "No postal codes configured",
}) => {
  const [visible, setVisible] = useState(false);

  const selectedEntry = useMemo(
    () => postalCodes.find((code) => code.postalCode === value),
    [postalCodes, value]
  );

  const handleSelect = (postalCode: string) => {
    onSelect(postalCode);
    setVisible(false);
  };

  const renderOption = ({ item }: { item: AllowedPostalCode }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => handleSelect(item.postalCode)}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.optionPostal}>{item.postalCode}</Text>
        {item.radiusKm ? (
          <Text style={styles.optionRadius}>{`~${item.radiusKm} km`}</Text>
        ) : null}
      </View>
      <Text style={styles.optionMeta}>
        {[item.city, item.district].filter(Boolean).join(" • ") || item.city}
      </Text>
    </TouchableOpacity>
  );

  const canOpen = !disabled && postalCodes.length > 0;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => canOpen && setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value
            ? selectedEntry
              ? `${selectedEntry.postalCode} • ${selectedEntry.district || selectedEntry.city}`
              : value
            : placeholder}
        </Text>
      </TouchableOpacity>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            {postalCodes.length === 0 ? (
              <Text style={styles.empty}>{emptyLabel}</Text>
            ) : (
              <FlatList
                data={postalCodes}
                keyExtractor={(item) =>
                  item.id ? item.id.toString() : item.postalCode
                }
                renderItem={renderOption}
                ItemSeparatorComponent={() => (
                  <View style={styles.separator} />
                )}
                style={{ maxHeight: 320, width: "100%" }}
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeButtonText}>{closeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    color: "#fffbe8",
    fontWeight: "600",
    marginBottom: 6,
  },
  trigger: {
    backgroundColor: "#231a13",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0b97f",
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  placeholder: {
    color: "#999",
  },
  value: {
    color: "#fffbe8",
    fontWeight: "600",
  },
  helper: {
    color: "#b8a68a",
    fontSize: 12,
    marginTop: 4,
  },
  error: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#2d2117",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 420,
  },
  modalTitle: {
    color: "#fffbe8",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  empty: {
    color: "#fffbe8",
    textAlign: "center",
    marginVertical: 16,
  },
  option: {
    paddingVertical: 10,
  },
  optionPostal: {
    color: "#e0b97f",
    fontSize: 18,
    fontWeight: "bold",
  },
  optionMeta: {
    color: "#fffbe8",
    fontSize: 14,
  },
  optionRadius: {
    color: "#b8a68a",
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "#3a2c1f",
    marginVertical: 6,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#e0b97f",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#231a13",
    fontWeight: "bold",
  },
});

export default PostalCodePicker;
