import React, { useState } from "react";
import { NavigationContainer, NavigationProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Modal, Pressable, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import AdminScreen from "../screens/AdminScreen";
import FindScreen from "../screens/FindScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MatchScreen from "../screens/MatchScreen";
import MyRidesScreen from "../screens/MyRidesScreen";
import OfferScreen from "../screens/OfferScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { colors } from "../theme";
import { RootStack } from "./types";

const Stack = createNativeStackNavigator<RootStack>();

type MenuItem = { label: string; onPress: () => void; danger?: boolean };

function Menu({ navigation }: { navigation: NavigationProp<RootStack> }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items: MenuItem[] = [
    { label: "Find a ride", onPress: () => navigation.navigate("Find") },
    { label: "Offer a ride", onPress: () => navigation.navigate("Offer") },
    ...(user ? [{ label: "My rides", onPress: () => navigation.navigate("MyRides") }] : []),
    ...(user?.role === "student" ? [{
      label: "Check ID status",
      onPress: () => navigation.navigate("Login", { checkStatus: true }),
    }] : []),
    ...(user?.role === "admin" ? [{ label: "Admin dashboard", onPress: () => navigation.navigate("Admin") }] : []),
    ...(!user
      ? [
        { label: "Log in", onPress: () => navigation.navigate("Login") },
        { label: "Create account", onPress: () => navigation.navigate("Register") },
      ]
      : [{ label: "Log out", danger: true, onPress: () => { logout(); } }]),
  ];

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Open navigation menu">
        <Text style={{ color: "white", fontWeight: "700", paddingHorizontal: 8 }}>Menu ☰</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => setOpen(false)}>
          <View style={{ alignSelf: "flex-end", marginTop: 58, marginRight: 12, width: 230, backgroundColor: "white", borderRadius: 14, padding: 8, elevation: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 8 }}>
              {user ? `Signed in as ${user.name}` : "Navigate"}
            </Text>
            {items.map(item => (
              <Pressable
                key={item.label}
                style={{ paddingHorizontal: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}>
                <Text style={{ color: item.danger ? colors.danger : colors.ink, fontWeight: "600" }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function AppNavigator() {
  const { ready } = useAuth();
  if (!ready) {
    return null;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: colors.greenDark },
          headerTintColor: "white",
          headerTitleStyle: { fontWeight: "800" },
          headerBackTitleVisible: false,
          headerRight: () => <Menu navigation={navigation} />,
        })}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "JC Smart Ride" }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Sign up" }} />
        <Stack.Screen name="Find" component={FindScreen} options={{ title: "Find Ride" }} />
        <Stack.Screen name="Offer" component={OfferScreen} options={{ title: "Offer Ride" }} />
        <Stack.Screen name="Match" component={MatchScreen} options={{ title: "Smart Match" }} />
        <Stack.Screen name="MyRides" component={MyRidesScreen} options={{ title: "My Rides" }} />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
