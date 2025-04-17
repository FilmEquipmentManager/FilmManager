import { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import ProtectedRoute from "../_wrappers/ProtectedRoute";

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

export default function HomepageScreen() {
    const [activeTab, setActiveTab] = useState<"scanner" | "management">(
        "scanner"
    );
    const [hoverScannerTab, setHoverScannerTab] = useState(false);
    const [hoverManagementTab, setHoverManagementTab] = useState(false);
    const [hoverReceive, setHoverReceive] = useState(false);
    const [hoverDispatch, setHoverDispatch] = useState(false);
    const [hoverCheckInfo, setHoverCheckInfo] = useState(false);
    const [hoverReward, setHoverReward] = useState(false);
    const [hoverUser, setHoverUser] = useState(false);
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isShortScreen = height < 750;
    const isMobileScreen = width < 680;

    const getHoverStyle = (hovered: boolean, baseStyle: object = {}) => ({
        transform: [{ scale: hovered ? 1.02 : 1 }],
        transitionDuration: "400ms",
        backgroundColor: "white",
        ...baseStyle,
    });

    return (
        <ProtectedRoute showAuth={false}>
            {(userData) => (
                userData.role === "Admin" ? (
                    <LinearGradient
                        colors={isMobileScreen ? ['#00FFDD', '#1B9CFF'] : ['#1B9CFF', '#00FFDD']}
                        start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                        end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    >
                        <VStack style={{ flex: 1, padding: 20 }} space="2xl">
                            <Box
                                style={{
                                    marginBottom: 50,
                                    marginTop: isMobileScreen
                                        ? isShortScreen
                                            ? 36
                                            : 100
                                        : isShortScreen
                                        ? 36
                                        : 40,
                                    width: "100%",
                                    alignItems: "center",
                                    height: "5%"
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={{
                                        lineHeight: 1,
                                        color: "white",
                                        fontSize: isMobileScreen
                                            ? isShortScreen
                                                ? 20
                                                : 28
                                            : isShortScreen
                                            ? 36
                                            : 40,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        padding: isMobileScreen ? 50 : 8,
                                    }}
                                >
                                    {getGreeting()}, {userData?.username}!
                                </Text>
                            </Box>

                            {/* Tab Navigation */}
                            <HStack style={{ backgroundColor: "backgroundLight100", padding: 2, width: isMobileScreen ? isShortScreen ? "100%" : "90%" : isShortScreen ? "60%" : "60%", borderRadius: 999, margin: "auto", marginBottom: 0, height: "5%" }} space="xl">
                                <Button
                                    onHoverIn={() => setHoverScannerTab(true)}
                                    onHoverOut={() => setHoverScannerTab(false)}
                                    onPress={() => setActiveTab("scanner")}
                                    style={{
                                        flex: 1,
                                        borderColor: "transparent",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderRadius: 10,
                                        ...getHoverStyle(hoverScannerTab, {
                                            backgroundColor:
                                                activeTab === "scanner"
                                                    ? "#1B9CFF"
                                                    : "white",
                                        }),
                                    }}
                                >
                                    <HStack space="sm" style={{ alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name="scan" size={ isMobileScreen ? 16 : 24} color={activeTab === "scanner" ? "white" : "black"} />
                                        <ButtonText style={{
                                            fontWeight: "600", color: activeTab === "scanner" ? "white" : "black",
                                            fontSize: isMobileScreen ? isShortScreen ? 16 : 18 : isShortScreen ? 20 : 20, textAlign: "center"
                                        }}>
                                            Scanner
                                        </ButtonText>
                                    </HStack>
                                </Button>

                                <Button
                                    onHoverIn={() => setHoverManagementTab(true)}
                                    onHoverOut={() => setHoverManagementTab(false)}
                                    onPress={() => setActiveTab("management")}
                                    style={{
                                        flex: 1,
                                        borderColor: "transparent",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderRadius: 10,
                                        ...getHoverStyle(hoverManagementTab, {
                                            backgroundColor:
                                                activeTab === "management"
                                                    ? "#1B9CFF"
                                                    : "white",
                                        }),
                                    }}
                                >
                                    <HStack space="sm" style={{ alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name="settings" size={ isMobileScreen ? 16 : 24} color={activeTab === "management" ? "white" : "black"} />
                                        <ButtonText style={{
                                            fontWeight: "600", color: activeTab === "management" ? "white" : "black",
                                            fontSize: isMobileScreen ? isShortScreen ? 16 : 18 : isShortScreen ? 20 : 20, textAlign: "center"
                                        }}>
                                            Management
                                        </ButtonText>
                                    </HStack>
                                </Button>
                            </HStack>

                            {activeTab === "scanner" ? (
                                <VStack space="xl" style={{ flex: 1, height: "90%" }}>
                                    <HStack
                                        style={{
                                            flexDirection: isMobileScreen
                                                ? "column"
                                                : isShortScreen
                                                ? "row"
                                                : "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            width: isMobileScreen ? "100%" : "70%",
                                            margin: "auto",
                                            marginBottom: isMobileScreen ? 24 : 40,
                                            marginTop: 40,
                                            height: isMobileScreen ? "70%" : "60%",
                                            gap: isMobileScreen ? 50 : 100,
                                        }}
                                        space="lg"
                                    >
                                        <Button
                                            size="xl"
                                            onHoverIn={() => setHoverReceive(true)}
                                            onHoverOut={() => setHoverReceive(false)}
                                            onPress={() => {
                                                router.push("/admin/scanner?mode=receive");
                                            }}
                                            style={{
                                                height: isMobileScreen
                                                    ? "auto"
                                                    : "100%",
                                                width: isMobileScreen ? "50%" : "50%",
                                                elevation: 5,
                                                flex: 1,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                ...getHoverStyle(hoverReceive),
                                            }}
                                        >
                                            <VStack
                                                style={{ alignItems: "center" }}
                                                space="sm"
                                            >
                                                <Ionicons
                                                    name="download"
                                                    size={
                                                        isMobileScreen
                                                            ? isShortScreen
                                                                ? 50
                                                                : 80
                                                            : isShortScreen
                                                            ? 50
                                                            : 200
                                                    }
                                                    color="#1B9CFF"
                                                />
                                                <ButtonText
                                                    style={{
                                                        color: "#1B9CFF",
                                                        fontSize: isMobileScreen
                                                            ? 20
                                                            : isShortScreen
                                                            ? 24
                                                            : 24,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Receive
                                                </ButtonText>
                                            </VStack>
                                        </Button>

                                        <Button
                                            size="xl"
                                            onHoverIn={() => setHoverDispatch(true)}
                                            onHoverOut={() => setHoverDispatch(false)}
                                            onPress={() => {
                                                router.push("/admin/scanner?mode=dispatch");
                                            }}
                                            style={{
                                                height: isMobileScreen
                                                    ? "auto"
                                                    : "100%",
                                                width: isMobileScreen ? "50%" : "50%",
                                                elevation: 5,
                                                flex: 1,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                ...getHoverStyle(hoverDispatch),
                                            }}
                                        >
                                            <VStack
                                                style={{ alignItems: "center" }}
                                                space="sm"
                                            >
                                                <Ionicons
                                                    name="arrow-up"
                                                    size={
                                                        isMobileScreen
                                                            ? isShortScreen
                                                                ? 50
                                                                : 80
                                                            : isShortScreen
                                                            ? 50
                                                            : 200
                                                    }
                                                    color="#1B9CFF"
                                                />
                                                <ButtonText
                                                    style={{
                                                        color: "#1B9CFF",
                                                        fontSize: isMobileScreen
                                                            ? 20
                                                            : isShortScreen
                                                            ? 24
                                                            : 24,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Dispatch
                                                </ButtonText>
                                            </VStack>
                                        </Button>
                                    </HStack>

                                    <Button
                                        onHoverIn={() => setHoverCheckInfo(true)}
                                        onHoverOut={() => setHoverCheckInfo(false)}
                                        onPress={() => {
                                            router.push("/admin/scanner?mode=info")
                                        }}
                                        style={{
                                            height: isMobileScreen
                                                ? "10%"
                                                : isShortScreen
                                                ? "20%"
                                                : "10%",
                                            alignSelf: "center",
                                            elevation: 5,
                                            borderRadius: 20,
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 4,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            ...getHoverStyle(hoverCheckInfo, {
                                                backgroundColor: "white",
                                            }),
                                        }}
                                    >
                                        <HStack space="sm">
                                            <Ionicons
                                                name="information-circle"
                                                size={24}
                                                color="#1B9CFF"
                                            />
                                            <ButtonText
                                                style={{
                                                    color: "#1B9CFF",
                                                    fontSize: 18,
                                                }}
                                            >
                                                Check Item's Info
                                            </ButtonText>
                                        </HStack>
                                    </Button>
                                </VStack>
                            ) : (
                                <VStack space="xl" style={{ flex: 1, height: "90%" }}>
                                    <HStack
                                        style={{
                                            flexDirection: isMobileScreen
                                                ? "column"
                                                : isShortScreen
                                                ? "row"
                                                : "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            width: isMobileScreen ? "100%" : "70%",
                                            margin: "auto",
                                            marginBottom: isMobileScreen ? 24 : 40,
                                            marginTop: 40,
                                            height: isMobileScreen ? "70%" : "60%",
                                            gap: isMobileScreen ? 50 : 100,
                                        }}
                                        space="lg"
                                    >
                                        <Button
                                            size="xl"
                                            onHoverIn={() => setHoverReward(true)}
                                            onHoverOut={() => setHoverReward(false)}
                                            style={{
                                                height: isMobileScreen
                                                    ? "auto"
                                                    : "100%",
                                                width: isMobileScreen ? "50%" : "50%",
                                                elevation: 5,
                                                flex: 1,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                ...getHoverStyle(hoverReward),
                                            }}
                                        >
                                            <VStack
                                                style={{ alignItems: "center" }}
                                                space="sm"
                                            >
                                                <Ionicons
                                                    name="gift"
                                                    size={
                                                        isMobileScreen
                                                            ? 80
                                                            : isShortScreen
                                                            ? 50
                                                            : 200
                                                    }
                                                    color="#1B9CFF"
                                                />
                                                <ButtonText
                                                    style={{
                                                        color: "#1B9CFF",
                                                        fontSize: isMobileScreen
                                                            ? 20
                                                            : isShortScreen
                                                            ? 24
                                                            : 24,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Reward Management
                                                </ButtonText>
                                            </VStack>
                                        </Button>

                                        <Button
                                            size="xl"
                                            onHoverIn={() => setHoverUser(true)}
                                            onHoverOut={() => setHoverUser(false)}
                                            style={{
                                                height: isMobileScreen
                                                    ? "auto"
                                                    : "100%",
                                                width: isMobileScreen ? "50%" : "50%",
                                                elevation: 5,
                                                flex: 1,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                ...getHoverStyle(hoverUser),
                                            }}
                                        >
                                            <VStack
                                                style={{ alignItems: "center" }}
                                                space="sm"
                                            >
                                                <Ionicons
                                                    name="people"
                                                    size={
                                                        isMobileScreen
                                                            ? 80
                                                            : isShortScreen
                                                            ? 50
                                                            : 200
                                                    }
                                                    color="#1B9CFF"
                                                />
                                                <ButtonText
                                                    style={{
                                                        color: "#1B9CFF",
                                                        fontSize: isMobileScreen
                                                            ? 20
                                                            : isShortScreen
                                                            ? 24
                                                            : 24,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    User Management
                                                </ButtonText>
                                            </VStack>
                                        </Button>
                                    </HStack>
                                </VStack>
                            )}
                        </VStack>
                    </LinearGradient>
                ) : (
                    <LinearGradient
                        colors={isMobileScreen ? ['#00FFDD', '#1B9CFF'] : ['#1B9CFF', '#00FFDD']}
                        start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                        end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    >
                        <VStack style={{ flex: 1, padding: 20 }} space="2xl">
                            <Box style={{ marginTop: isMobileScreen ? 40 : 80, width: "100%" }}>
                                <Text style={{
                                    color: "white",
                                    fontSize: isMobileScreen ? 28 : 36,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                }}>
                                    {getGreeting()}, {userData?.username}!
                                </Text>
                                <Text style={{
                                    color: "rgba(255,255,255,0.9)",
                                    fontSize: isMobileScreen ? 16 : 18,
                                    textAlign: "center",
                                    marginTop: 20
                                }}>
                                    Ready to explore amazing rewards?
                                </Text>
                            </Box>

                            <HStack 
                                style={{ 
                                    flex: 1,
                                    flexDirection: isMobileScreen ? "column" : "row", 
                                    gap: 24,
                                    padding: 20,
                                    justifyContent: "center",
                                    alignItems: "center"
                                }}
                            >
                                <Button
                                    onHoverIn={() => setHoverReceive(true)}
                                    onHoverOut={() => setHoverReceive(false)}
                                    onPress={() => router.push("/client/redeem")}
                                    style={{
                                        width: isMobileScreen ? "100%" : 300,
                                        height: isMobileScreen ? 200 : 350,
                                        backgroundColor: "white",
                                        borderRadius: 24,
                                        padding: 24,
                                        ...getHoverStyle(hoverReceive, {
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 12,
                                        }),
                                    }}
                                >
                                    <VStack space="md" style={{ alignItems: "center" }}>
                                        <LinearGradient
                                            colors={['#1B9CFF', '#00FFDD']}
                                            style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 16,
                                                justifyContent: "center",
                                                alignItems: "center"
                                            }}
                                        >
                                            <Ionicons name="gift" size={40} color="white" />
                                        </LinearGradient>
                                        <Text style={{
                                            fontSize: isMobileScreen ? 20 : 24,
                                            fontWeight: "bold",
                                            color: "#1B9CFF",
                                            marginTop: 16
                                        }}>
                                            Available Rewards
                                        </Text>
                                        <Text style={{
                                            textAlign: "center",
                                            color: "#666",
                                            fontSize: isMobileScreen ? 14 : 16
                                        }}>
                                            Browse and redeem exciting rewards using your points
                                        </Text>
                                    </VStack>
                                </Button>

                                <Button
                                    onHoverIn={() => setHoverDispatch(true)}
                                    onHoverOut={() => setHoverDispatch(false)}
                                    onPress={() => router.push("/client/rewards")}
                                    style={{
                                        width: isMobileScreen ? "100%" : 300,
                                        height: isMobileScreen ? 200 : 350,
                                        backgroundColor: "white",
                                        borderRadius: 24,
                                        padding: 24,
                                        ...getHoverStyle(hoverDispatch, {
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 12,
                                        }),
                                    }}
                                >
                                    <VStack space="md" style={{ alignItems: "center" }}>
                                        <LinearGradient
                                            colors={['#FF6B6B', '#FF8E53']}
                                            style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 16,
                                                justifyContent: "center",
                                                alignItems: "center"
                                            }}
                                        >
                                            <Ionicons name="trophy" size={40} color="white" />
                                        </LinearGradient>
                                        <Text style={{
                                            fontSize: isMobileScreen ? 20 : 24,
                                            fontWeight: "bold",
                                            color: "#FF6B6B",
                                            marginTop: 16
                                        }}>
                                            My Rewards
                                        </Text>
                                        <Text style={{
                                            textAlign: "center",
                                            color: "#666",
                                            fontSize: isMobileScreen ? 14 : 16
                                        }}>
                                            View your redeemed rewards and track their status
                                        </Text>
                                    </VStack>
                                </Button>
                            </HStack>

                            <Box style={{
                                backgroundColor: "rgba(255,255,255,0.2)",
                                padding: 16,
                                borderRadius: 16,
                                marginBottom: 24,
                                alignSelf: "center"
                            }}>
                                <HStack space="sm" style={{ alignItems: "center" }}>
                                    <Ionicons name="wallet" size={24} color="white" />
                                    <Text style={{ color: "white", fontSize: 16 }}>
                                        Available Points: 
                                    </Text>
                                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                                        {userData?.points || 0} PTS
                                    </Text>
                                </HStack>
                            </Box>
                        </VStack>
                    </LinearGradient>
                )
            )}
        </ProtectedRoute>
    );
}