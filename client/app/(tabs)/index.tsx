import { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Film, LogInIcon } from "lucide-react-native";

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
    const { userData, loading } = useAuth();
    const { width, height } = useWindowDimensions();
    const isShortScreen = height < 750;
    const isLargeScreen = width >= 765;
    const isMobileScreen = width < 680;

    const getHoverStyle = (hovered: boolean, baseStyle: object = {}) => ({
        transform: [{ scale: hovered ? 1.02 : 1 }],
        transitionDuration: "400ms",
        backgroundColor: "white",
        ...baseStyle,
    });

    if (loading) {
        return (
            <LinearGradient
                colors={["#00FFDD", "#1B9CFF"]}
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Spinner size="large" />
            </LinearGradient>
        );
    }

    if (!userData) {
        return (
            <LinearGradient
                colors={["#00FFDD", "#1B9CFF"]}
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 24,
                }}
            >
                <Card
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: 24,
                        padding: 24,
                        width: "90%",
                        maxWidth: 400,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 5,
                    }}
                >
                    <VStack space="xl" style={{ alignItems: "center" }}>
                        <Icon
                            as={Film as any}
                            color="#1B9CFF"
                            style={{ marginBottom: 16, width: 40, height: 40 }}
                        />

                        <Text
                            style={{
                                color: "#333",
                                fontSize: 28,
                                fontWeight: "700",
                                textAlign: "center",
                                marginBottom: 8,
                                padding: 10,
                                lineHeight: 35,
                            }}
                        >
                            Welcome to FilmManager
                        </Text>

                        <Text
                            style={{
                                color: "#666",
                                fontSize: 16,
                                textAlign: "center",
                                marginBottom: 24,
                                lineHeight: 24,
                            }}
                        >
                            Please log in or create an account to access your
                            profile and manage your content.
                        </Text>

                        <Button
                            onPress={() => {
                                router.push("/profile/profile");
                            }}
                            style={{
                                backgroundColor: "#1B9CFF",
                                borderRadius: 12,
                                width: "100%",
                                elevation: 3,
                            }}
                        >
                            <HStack
                                space="sm"
                                style={{
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Icon as={LogInIcon} size="md" color="white" />
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: "600",
                                        color: "white",
                                    }}
                                >
                                    Login / Register
                                </Text>
                            </HStack>
                        </Button>
                    </VStack>
                </Card>
            </LinearGradient>
        );
    }

    if (userData) return (
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
                            : 50,
                        width: "100%",
                        alignItems: "center",
                        height: "5%",
                    }}
                >
                    <Text
                        style={{
                            color: "white",
                            fontSize: isMobileScreen
                                ? isShortScreen
                                    ? 20
                                    : 28
                                : isShortScreen
                                ? 36
                                : 50,
                            fontWeight: "bold",
                            textAlign: "center",
                            padding: 10,
                        }}
                    >
                        {getGreeting()}, {userData.username}!
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
                                    router.push("/scanner/scanner" as any);
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
                                    router.push("/scanner/scanner" as any);
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
                                router.push("/scanner/scanner" as any);
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
    );
}