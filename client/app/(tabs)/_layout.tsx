import React from "react";
import { SafeAreaView, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { BookOpen, HouseIcon, User, User2 } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { useRouter, useSegments } from "expo-router";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";

export default function TabLayout() {
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 600;
    const router = useRouter();
    const segments = useSegments();

    function renderTabButton(
        tab: { name: string; route: string; icon: any },
        isActive: boolean,
        onPress: () => void
    ) {
        return (
            <Button
                key={tab.route}
                onPress={onPress}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 20,
                    marginTop: 20,
                    marginBottom: 20,
                }}
            >
                <Icon
                    as={tab.icon}
                    style={{ size: 18 }}
                    color={isActive ? "$red10" : "$color"}
                />
                <Text
                    style={{
                        marginLeft: 6,
                        color: isActive ? "$red10" : "$color",
                    }}
                >
                    {tab.name}
                </Text>
            </Button>
        );
    }

    const CustomHeader = () => {
        const tabs = [
            { name: "Components", route: "/components", icon: BookOpen },
            { name: "Profile", route: "/profile", icon: User },
        ];

        return (
            <SafeAreaView
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                }}
            >
                <Pressable onPress={() => router.push("/" as any)}>
                    <HStack
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginLeft: 20,
                            marginTop: 10,
                            marginBottom: 10,
                            gap: 8,
                            cursor: "pointer",
                        }}
                    >
                        <Image
                            source={require("../../assets/images/icon.png")}
                            style={{
                                width: 28,
                                height: 28,
                                marginRight: 8,
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: "bold",
                            }}
                        >
                            Film Manager
                        </Text>
                    </HStack>
                </Pressable>

                <SafeAreaView style={{ flexDirection: "row" }}>
                    {tabs.map((tab) => {
                        const isActive =
                            segments[0] === tab.route.split("/")[1];
                        const handlePress = () => router.push(tab.route as any);
                        return renderTabButton(tab, isActive, handlePress);
                    })}
                </SafeAreaView>
            </SafeAreaView>
        );
    };

    return (
        <Tabs
            screenOptions={{
                tabBarStyle: isLargeScreen
                    ? { display: "none" }
                    : {
                          backgroundColor: "#fff",
                          borderTopColor: "#ccc",
                      },
                tabBarActiveTintColor: "#e11d48",
                headerStyle: {
                    backgroundColor: "#fff",
                    borderBottomColor: "#ccc",
                },
                headerTintColor: "#000",
                headerShown: isLargeScreen,
                header: () => <CustomHeader />,
            }}
        >
            {/* Explicitly define the Home screen */}
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => <Icon as={HouseIcon as any} />,
                }}
            />
            {/* Explicitly define the Profile screen */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => <Icon as={User2 as any} />,
                }}
            />
        </Tabs>
    );
}