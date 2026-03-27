import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import { AccountScreen } from "../screens/AccountScreen";
import { AttendanceHistoryScreen } from "../screens/AttendanceHistoryScreen";
import { AttendanceHomeScreen } from "../screens/AttendanceHomeScreen";
import { ManagerApprovalsScreen } from "../screens/ManagerApprovalsScreen";
import {
  ManagerReportsScreen,
  ManagerScheduleScreen,
  ManagerTeamScreen,
} from "../screens/ManagerShellScreens";
import { EMPLOYEE_TABS, getMobileTabs } from "./mobileTabs";
import { useMobileRuntime } from "../providers/useMobileRuntime";
import { colors, radius } from "../theme/tokens";

type TabParamList = {
  Home: undefined;
  History: undefined;
  Account: undefined;
  Team: undefined;
  Approvals: undefined;
  Schedule: undefined;
  Reports: undefined;
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
  Team: "Team",
  Approvals: "Approvals",
  Schedule: "Schedule",
  Reports: "Reports",
};

export function AppTabs() {
  const runtime = useMobileRuntime();
  const activeTabs = getMobileTabs(runtime.hasManagerAccess);
  const isManagerView = activeTabs[0] === "Team";

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
        {isManagerView ? (
          <>
            <Tab.Screen name="Team" component={ManagerTeamScreen} />
            <Tab.Screen name="Approvals" component={ManagerApprovalsScreen} />
            <Tab.Screen name="Schedule" component={ManagerScheduleScreen} />
            <Tab.Screen name="Reports" component={ManagerReportsScreen} />
          </>
        ) : (
          <>
            <Tab.Screen name={EMPLOYEE_TABS[0]} component={AttendanceHomeScreen} />
            <Tab.Screen name={EMPLOYEE_TABS[1]} component={AttendanceHistoryScreen} />
            <Tab.Screen name={EMPLOYEE_TABS[2]} component={AccountScreen} />
          </>
        )}
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
    marginHorizontal: 2,
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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tabChipTextActive: {
    color: colors.goldSoft,
  },
});
