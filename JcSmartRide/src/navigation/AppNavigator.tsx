import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";
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

function Menu({ navigation }: { navigation: { navigate: (name: keyof RootStack) => void } }) {
  const { user, logout } = useAuth();
  if (!user) {
    return (
      <Pressable onPress={() => navigation.navigate("Login")}>
        <Text style={{ color: "white" }}>Login</Text>
      </Pressable>
    );
  }
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Pressable
        onPress={() => navigation.navigate(user.role === "admin" ? "Admin" : "MyRides")}>
        <Text style={{ color: "white" }}>{user.role === "admin" ? "Admin" : "My Rides"}</Text>
      </Pressable>
      <Pressable onPress={logout}>
        <Text style={{ color: "white" }}>Log out</Text>
      </Pressable>
    </View>
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
