import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Eye, EyeClosed } from "lucide-react-native";

export default function TabTwoScreen() {
    const [isHovered, setIsHovered] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { width, height } = useWindowDimensions();
    const isLargeScreen = width >= 765;
    const isShortScreen = height < 750;

    const password = "12345678";
    const maskedPassword = "**********";

    return (
        <HStack
            style={{
                flex: 1,
                gap: isLargeScreen ? 16 : 8,
                padding: isLargeScreen ? 16 : 24,
                marginTop: isLargeScreen && isShortScreen ? 20 : 0,
                justifyContent: isLargeScreen ? "center" : "space-between",
                alignItems: "center",
                flexDirection: isLargeScreen ? "row" : "column",
            }}
        >
            <HStack
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: isLargeScreen ? "40%" : "100%",
                    height: isLargeScreen ? "100%" : "30%",
                    marginTop: 20,
                    marginBottom: -50,
                }}
            >
                <Avatar
                    style={{
                        borderRadius: 9999,
                        width: isLargeScreen ? 300 : isShortScreen ? 100 : 140,
                        height: isLargeScreen ? 300 : isShortScreen ? 100 : 140,
                        overflow: "hidden",
						marginTop: isLargeScreen ? -80 : 50,
                    }}
                >
                    <AvatarFallbackText>User Avatar</AvatarFallbackText>
                    <AvatarImage
                        accessibilityLabel="User Avatar"
                        source={{ uri: "https://bit.ly/dan-abramov" }}
                        style={{ width: "100%", height: "100%" }}
                    />
                </Avatar>
            </HStack>

            <VStack
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: isLargeScreen ? "60%" : "100%",
                    padding: isLargeScreen ? 0 : 16,
                    height: isLargeScreen ? "100%" : "70%",
                    gap: 16,
                    flex: 1,
                }}
            >
                <Card
                    style={{
                        backgroundColor: "white",
                        borderRadius: 20,
                        padding: isLargeScreen ? 10 : isShortScreen ? 5 : 10,
                        width: isLargeScreen ? "80%" : "100%",
                    }}
                >
                    <VStack style={{ padding: 16, gap: 12 }}>
                        <Text
                            style={{
                                fontSize: isLargeScreen ? 32 : 28,
                                fontWeight: "800",
                                textAlign: "center",
                                paddingTop: 10,
								marginBottom: 10,
                            }}
                        >
                            John Doe
                        </Text>

                        <VStack style={{ marginBottom: 10 }}>
                            <Text
                                style={{
                                    color: "#A0A0A0",
                                    fontWeight: "500",
                                    fontSize: 20,
                                }}
                            >
                                Username
                            </Text>

                            <Input
								variant="underlined"
                                style={{
									marginTop: 5,
                                    backgroundColor: "transparent",
                                    padding: 0
                                }}
                            >
                                <InputField
									editable={false}
                                    placeholder="johndoe19"
                                    style={{ fontSize: 20, fontWeight: "600" }}
                                />
                            </Input>
                        </VStack>

                        <VStack>
                            <Text
                                style={{
                                    color: "#A0A0A0",
                                    fontWeight: "500",
                                    fontSize: 20,
                                }}
                            >
                                Password
                            </Text>

                            <HStack
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Input
									variant="underlined"
                                    style={{
                                        flex: 1,
										marginTop: 5,
                                        backgroundColor: "transparent",
                                        padding: 0
                                    }}
                                >
                                    <InputField
                                        value={showPassword ? password : maskedPassword}
                                        editable={false}
                                        style={{
                                            fontSize: 20,
                                            fontWeight: "600",
                                        }}
                                    />
                                </Input>

                                <Button
                                    style={{ backgroundColor: "transparent" }}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Icon
                                        as={showPassword ? EyeClosed : (Eye as any)}
                                        size="md"
                                        color="#000"
                                    />
                                </Button>
                            </HStack>
                        </VStack>

                        <VStack style={{ marginTop: 20 }}>
							<Text
                                style={{
									textAlign: "center",
                                    fontSize: isLargeScreen ? 36 : 30,
                                    fontWeight: "800",
                                    color: "#1B9CFF",
                                    paddingTop: 15,
									marginBottom: isLargeScreen ? 15 : 0,
                                }}
                            >
                                2,450
                            </Text>

                            <Text
                                style={{
									textAlign: "center",
                                    color: "#A0A0A0",
                                    fontWeight: "500",
                                    fontSize: isLargeScreen ? 20 : 14,
                                }}
                            >
                                Points Remaining
                            </Text>
                        </VStack>
                    </VStack>
                </Card>

                <Button
                    onHoverIn={() => setIsHovered(true)}
                    onHoverOut={() => setIsHovered(false)}
                    style={{
                        marginTop: 10,
                        marginBottom: 20,
                        backgroundColor: isHovered ? "#FF4D4D" : "#FF8383",
                        borderRadius: 10,
                        alignSelf: "center",
                        width: isLargeScreen ? "80%" : "100%",
                        transform: [{ scale: isHovered ? 1.01 : 1 }],
                        transitionDuration: "200ms",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "700" }}>
                        Log Out
                    </Text>
                </Button>
            </VStack>
        </HStack>
    );
}