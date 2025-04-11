import { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

export default function TabOneScreen() {
    const [activeTab, setActiveTab] = useState<"scanner" | "management">("scanner");
    const [hoverScannerTab, setHoverScannerTab] = useState(false);
    const [hoverManagementTab, setHoverManagementTab] = useState(false);
    const [hoverReceive, setHoverReceive] = useState(false);
    const [hoverDispatch, setHoverDispatch] = useState(false);
    const [hoverCheckInfo, setHoverCheckInfo] = useState(false);
    const [hoverReward, setHoverReward] = useState(false);
    const [hoverUser, setHoverUser] = useState(false);
    const router = useRouter();

    const getHoverStyle = (hovered: boolean, baseStyle: object = {}) => ({
        transform: [{ scale: hovered ? 1.03 : 1 }],
        transitionDuration: "400ms",
        backgroundColor: "white",
        ...baseStyle,
    });

    return (
        <LinearGradient
            colors={['#1B9CFF', '#00FFDD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <VStack style={{ flex: 1, padding: 20 }} space="2xl">
                {/* Welcome Header */}
                <Box style={{ marginBottom: 50, marginTop: 50, width: "100%", alignItems: "center", height: "5%" }}>
                    <Text style={{ color: "white", fontSize: 50, fontWeight: "bold" }}>
                        {getGreeting()}, John Doe!
                    </Text>
                </Box>

                {/* Tab Navigation */}
                <HStack style={{ backgroundColor: "backgroundLight100", padding: 2, width: "30%", borderRadius: 999, margin: "auto", marginBottom: 0, height: "5%" }} space="xl">
                    <Button
                        onHoverIn={() => setHoverScannerTab(true)}
                        onHoverOut={() => setHoverScannerTab(false)}
                        onPress={() => setActiveTab("scanner")}
                        style={{
                            flex: 1,
                            borderColor: "transparent",
                            borderRadius: 10,
                            ...getHoverStyle(hoverScannerTab, {
                                backgroundColor: activeTab === "scanner" ? "#1B9CFF" : "white",
                            }),
                        }}
                    >
                        <HStack style={{ justifyContent: "center", alignItems: "center" }} space="sm">
                            <Ionicons name="scan" size={20} color={activeTab === "scanner" ? "white" : "black"} />
                            <ButtonText style={{ fontWeight: "600", color: activeTab === "scanner" ? "white" : "black", }}>
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
                            borderRadius: 10,
                            ...getHoverStyle(hoverManagementTab, {
                                backgroundColor: activeTab === "management" ? "#1B9CFF" : "white",
                            }),
                        }}
                    >
                        <HStack style={{ justifyContent: "center", alignItems: "center" }} space="sm">
                            <Ionicons name="settings" size={20} color={activeTab === "management" ? "white" : "black"} />
                            <ButtonText style={{ fontWeight: "600", color: activeTab === "management" ? "white" : "black", }}>
                                Management
                            </ButtonText>
                        </HStack>
                    </Button>
                </HStack>

                {/* Tab Content */}
                {activeTab === "scanner" ? (
                    <VStack space="xl" style={{ flex: 1, height: "90%" }}>
                        <HStack style={{ justifyContent: "space-between", width: "50%", alignItems: "center", margin: "auto", marginBottom: 40, marginTop: 40, height: "60%", gap: 200 }} space="lg">
                            <Button
                                size="xl"
                                onHoverIn={() => setHoverReceive(true)}
                                onHoverOut={() => setHoverReceive(false)}
                                onPress={() => {
                                    router.push("/scannerReceive" as any);
                                }}
                                style={{
                                    height: "100%",
                                    width: "50%",
                                    elevation: 5,
                                    flex: 1,
                                    borderRadius: 20,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    // Ensure the button content is centered so that the scaling transformation
                                    // enlarges equally in all directions.
                                    justifyContent: "center",
                                    alignItems: "center",
                                    ...getHoverStyle(hoverReceive),
                                }}
                            >
                                <VStack style={{ alignItems: "center" }} space="sm">
                                    <Ionicons name="download" size={200} color="#1B9CFF" />
                                    <ButtonText style={{ color: "#1B9CFF", fontSize: 24 }}>Receive</ButtonText>
                                </VStack>
                            </Button>

                            <Button
                                size="xl"
                                onHoverIn={() => setHoverDispatch(true)}
                                onHoverOut={() => setHoverDispatch(false)}
                                style={{
                                    height: "100%",
                                    width: "50%",
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
                                <VStack style={{ alignItems: "center" }} space="sm">
                                    <Ionicons name="arrow-up" size={200} color="#1B9CFF" />
                                    <ButtonText style={{ color: "#1B9CFF", fontSize: 24 }}>Dispatch</ButtonText>
                                </VStack>
                            </Button>
                        </HStack>

                        <Button
                            onHoverIn={() => setHoverCheckInfo(true)}
                            onHoverOut={() => setHoverCheckInfo(false)}
                            style={{
                                height: "10%",
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
                                <Ionicons name="information-circle" size={24} color="#1B9CFF" />
                                <ButtonText style={{ color: "#1B9CFF", fontSize: 18 }}>
                                    Check Item's Info
                                </ButtonText>
                            </HStack>
                        </Button>
                    </VStack>
                ) : (
                    <VStack space="xl" style={{ flex: 1, height: "90%" }}>
                        <HStack style={{ justifyContent: "space-between", width: "50%", alignItems: "center", margin: "auto", marginBottom: 40, marginTop: 40, height: "60%", gap: 200 }} space="lg">
                            <Button
                                size="xl"
                                onHoverIn={() => setHoverReward(true)}
                                onHoverOut={() => setHoverReward(false)}
                                style={{
                                    height: "100%",
                                    width: "50%",
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
                                <VStack style={{ alignItems: "center" }} space="sm">
                                    <Ionicons name="gift" size={200} color="#1B9CFF" />
                                    <ButtonText style={{ color: "#1B9CFF", fontSize: 24 }}>Reward Management</ButtonText>
                                </VStack>
                            </Button>

                            <Button
                                size="xl"
                                onHoverIn={() => setHoverUser(true)}
                                onHoverOut={() => setHoverUser(false)}
                                style={{
                                    height: "100%",
                                    width: "50%",
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
                                <VStack style={{ alignItems: "center" }} space="sm">
                                    <Ionicons name="people" size={200} color="#1B9CFF" />
                                    <ButtonText style={{ color: "#1B9CFF", fontSize: 24 }}>User Management</ButtonText>
                                </VStack>
                            </Button>
                        </HStack>
                    </VStack>
                )}
            </VStack>
        </LinearGradient>
    );
}
