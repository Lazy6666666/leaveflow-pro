import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import { AccountScreen } from "../screens/AccountScreen";
import { AttendanceHistoryScreen } from "../screens/AttendanceHistoryScreen";
import { AttendanceHomeScreen } from "../screens/AttendanceHomeScreen";
import { colors, radius } from "../theme/tokens";

type TabParamList = {
  Home: undefined;
  History: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.ink,
    card: colors.panel,
    text: colors.text,
    border: colors.border,
    primary: colors.gold,
  },
};

const LABELS: Record<keyof TabParamList, string> = {
  Home: "Shift",
  History: "Ledger",
  Account: "Profile",
};

export function AppTabs() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabChip, focused && styles.tabChipActive]}>
              <Text style={[styles.tabChipText, focused && styles.tabChipTextActive]}>
                {LABELS[route.name as keyof TabParamList]}
              </Text>
            </View>
          ),
        })}
      >
        <Tab.Screen name="Home" component={AttendanceHomeScreen} />
        <Tab.Screen name="History" component={AttendanceHistoryScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 16,
    height: 74,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "rgba(24, 21, 17, 0.96)",
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
  },
  tabBarItem: {
    marginHorizontal: 4,
  },
  tabChip: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radius.pill,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  tabChipActive: {
    backgroundColor: "rgba(199, 161, 94, 0.14)",
  },
  tabChipText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  tabChipTextActive: {
    color: colors.goldSoft,
  },
});
