import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { CardField, useStripe, StripeProvider, CardFieldInput } from '@stripe/stripe-react-native';
import ENV from '../config/env';

const PaymentScreen = () => {
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [loading, setLoading] = useState(false);
  const { confirmPayment } = useStripe();

  const handlePayPress = async () => {
    setLoading(true);
    try {
      // Call backend to create PaymentIntent
      const response = await fetch(`${ENV.API_URL}/payment/stripe-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, currency: 'eur' }), // Example amount
      });
      const { clientSecret } = await response.json();
      if (!clientSecret) throw new Error('No client secret');
      // Confirm payment
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {}, // No card property needed
      });
      if (error) Alert.alert('Payment failed', error.message);
      else Alert.alert('Payment successful', `Status: ${paymentIntent.status}`);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert('Error', 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <StripeProvider publishableKey={ENV.STRIPE_PUBLISHABLE_KEY}>
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, marginBottom: 16 }}>Pay with Card</Text>
        <CardField
          postalCodeEnabled={false}
          placeholders={{ number: '4242 4242 4242 4242' }}
          cardStyle={{ backgroundColor: '#FFFFFF', textColor: '#000000' }}
          style={{ width: '100%', height: 50, marginVertical: 30 }}
          onCardChange={(card: CardFieldInput.Details) => setCardDetails(card)}
        />
        <Button title={loading ? 'Processing...' : 'Pay €10'} onPress={handlePayPress} disabled={loading || !cardDetails?.complete} />
      </View>
    </StripeProvider>
  );
};

export default PaymentScreen;
