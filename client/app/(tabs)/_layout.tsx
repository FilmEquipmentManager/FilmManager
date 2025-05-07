// @ts-nocheck
import { SafeAreaView, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { GlobeIcon, HouseIcon, ShoppingCart, User2 } from "lucide-react-native";
import { HStack } from "@/components/ui/hstack";
import { useRouter } from "expo-router";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { LinearGradient } from "expo-linear-gradient";
import { Menu, MenuItem, MenuItemLabel  } from "@/components/ui/menu";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

export default function TabLayout() {
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 680;
    const router = useRouter();
    const { t } = useTranslation();

    const CustomHeader = () => {
        return (
            <>
                <SafeAreaView
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        backgroundColor: "#fff",
                    }}
                >
                    <Pressable onPress={() => router.push("/" as any)}>
                        <HStack
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginLeft: 20,
                                gap: 8,
                                cursor: "pointer",
                            }}
                        >
                            <Image
                                alt="Film Manager Logo"
                                source={require("../../assets/images/icon.png")}
                                size="xs"
                            />
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                }}
                            >
                                Film Manager
                            </Text>
                        </HStack>
                    </Pressable>

                    <SafeAreaView style={{ flexDirection: "row", alignItems: "center" }}>
                        <Menu
                            placement="bottom"
                            offset={5}
                            trigger={({ ...triggerProps }) => {
                                return (
                                <Pressable
                                    {...triggerProps}
                                    style={{
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    marginRight: 12,
                                    backgroundColor: "#f3f4f6",
                                    borderRadius: 6,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    }}
                                >
                                    <Icon as={GlobeIcon} size="sm" color="#4b5563" className="mr-2" />
                                    <Text style={{ color: "#1f2937", fontSize: 14 }}>
                                    {t("navbarChangeLanguage")}
                                    </Text>
                                </Pressable>
                                );
                            }}
                            >
                            <MenuItem
                                key="en"
                                textValue="English"
                                onPress={() => {
                                i18n.changeLanguage("en");
                                localStorage.setItem("i18nextLng", "en");
                                }}
                            >
                                <MenuItemLabel size="sm">English (EN)</MenuItemLabel>
                            </MenuItem>
                            <MenuItem
                                key="cn"
                                textValue="中文"
                                onPress={() => {
                                i18n.changeLanguage("cn");
                                localStorage.setItem("i18nextLng", "cn");
                                }}
                            >
                                <MenuItemLabel size="sm">中文 (CN)</MenuItemLabel>
                            </MenuItem>
                        </Menu>
                        {/* Avatar for Profile */}
                        <Pressable
                            onPress={() => router.push("/auth/account" as any)}
                            style={{
                                marginRight: 20,
                                marginTop: 20,
                                marginBottom: 20,
                            }}
                        >
                            <Avatar
                                style={{
                                    borderRadius: 9999,
                                    width: 40,
                                    height: 40,
                                    overflow: "hidden",
                                }}
                            >
                                <AvatarFallbackText>{t("Profile")}</AvatarFallbackText>
                                <AvatarImage
                                    accessibilityLabel="User Avatar"
                                    source={{ uri: "https://bit.ly/dan-abramov" }}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </Avatar>
                        </Pressable>
                    </SafeAreaView>
                </SafeAreaView>
                <LinearGradient
                    colors={["#00FFDD", "#1B9CFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 1 }}
                />
            </>
        );
    };

    return (
		<Tabs
			screenOptions={{
				tabBarStyle: isLargeScreen
					? { display: "none" }
					: {
							backgroundColor: "#fff",
							borderTopColor: "#ccc"
						},
				tabBarActiveTintColor: "#e11d48",
				tabBarShowLabel: true,
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: "bold",
					textTransform: "capitalize"
				},
				headerStyle: {
					backgroundColor: "#fff",
					borderBottomColor: "#ccc"
				},
				headerTintColor: "#000",
				headerShown: isLargeScreen,
				header: () => <CustomHeader />
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => <Icon as={HouseIcon as any} color={color} />
				}}
			/>
			<Tabs.Screen
				name="auth/account"
				options={{
					title: "Profile",
					tabBarIcon: ({ color }) => <Icon as={User2 as any} color={color} />
				}}
			/>
			<Tabs.Screen
				name="admin/scanner"
				options={{
					href: null
				}}
			/>
			<Tabs.Screen
				name="client/redeem"
				options={{
					href: null
				}}
			/>
			<Tabs.Screen
				name="client/rewards"
				options={{
					href: null
				}}
			/>
			<Tabs.Screen
				name="admin/itemsManagement"
				options={{
					href: null
				}}
			/>
			<Tabs.Screen
				name="admin/userManagement"
				options={{
					href: null
				}}
			/>
		</Tabs>
	);
}