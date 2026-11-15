import { Alert, Linking } from "react-native";

export async function callPhoneNumber(phone: string) {
  const url = `tel:${phone}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Calling unavailable", "This device cannot open the phone dialer.");
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert(
      "Calling unavailable",
      error instanceof Error ? error.message : "Could not open the phone dialer.",
    );
  }
}
