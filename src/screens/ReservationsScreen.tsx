import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Button, Card, TextInput, useTheme } from "react-native-paper";

const ReservationsScreen = () => {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const timeSlots = [
    "5:00 PM",
    "5:30 PM",
    "6:00 PM",
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
    "8:30 PM",
    "9:00 PM",
    "9:30 PM",
    "10:00 PM",
  ];

  const partySizes = ["1", "2", "3", "4", "5", "6", "7", "8+"];

  const handleReservation = () => {
    if (!selectedTime || !customerName || !customerPhone) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    Alert.alert(
      "Reservation Confirmed!",
      `Table for ${partySize} on ${selectedDate.toDateString()} at ${selectedTime}. We'll see you soon, ${customerName}!`
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={styles.title}>Reserve Your Table</Text>
      <Text style={styles.subtitle}>Book a table at our cozy bar & grill</Text>

      {/* Date Selection */}
      <Card style={styles.card}>
        <Card.Title title="Select Date" />
        <Card.Content>
          <TouchableOpacity style={styles.dateButton}>
            <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Time Selection */}
      <Card style={styles.card}>
        <Card.Title title="Select Time" />
        <Card.Content>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.selectedTimeText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Party Size */}
      <Card style={styles.card}>
        <Card.Title title="Party Size" />
        <Card.Content>
          <View style={styles.partySizeGrid}>
            {partySizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.partySizeButton,
                  partySize === size && styles.selectedPartySizeButton,
                ]}
                onPress={() => setPartySize(size)}
              >
                <Text
                  style={[
                    styles.partySizeText,
                    partySize === size && styles.selectedPartySizeText,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Customer Information */}
      <Card style={styles.card}>
        <Card.Title title="Your Information" />
        <Card.Content>
          <TextInput
            label="Name *"
            value={customerName}
            onChangeText={setCustomerName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Phone Number *"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          <TextInput
            label="Email (Optional)"
            value={customerEmail}
            onChangeText={setCustomerEmail}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleReservation}
        style={styles.reserveButton}
        contentStyle={styles.reserveButtonContent}
      >
        Reserve Table
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fffbe8",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#e0b97f",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#2d2117",
    borderRadius: 16,
  },
  dateButton: {
    backgroundColor: "#e0b97f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dateText: {
    color: "#231a13",
    fontSize: 16,
    fontWeight: "bold",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeSlot: {
    width: "30%",
    backgroundColor: "#231a13",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0b97f",
  },
  selectedTimeSlot: {
    backgroundColor: "#e0b97f",
  },
  timeText: {
    color: "#fffbe8",
    fontWeight: "bold",
  },
  selectedTimeText: {
    color: "#231a13",
  },
  partySizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  partySizeButton: {
    width: "22%",
    backgroundColor: "#231a13",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0b97f",
  },
  selectedPartySizeButton: {
    backgroundColor: "#e0b97f",
  },
  partySizeText: {
    color: "#fffbe8",
    fontWeight: "bold",
  },
  selectedPartySizeText: {
    color: "#231a13",
  },
  input: {
    marginBottom: 12,
  },
  reserveButton: {
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: "#e0b97f",
  },
  reserveButtonContent: {
    paddingVertical: 8,
  },
});

export default ReservationsScreen;
