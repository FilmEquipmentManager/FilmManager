import { useState, useEffect } from "react";
import { useWindowDimensions, ScrollView, Alert } from "react-native";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Eye, EyeClosed } from "lucide-react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import server from "../../../networking";

type AuthFormProps = {
    isRegister: boolean;
    onSubmit: (
        email: string,
        password: string,
        username?: string
    ) => Promise<void>;
    error?: string;
    switchForm: () => void;
};

const AuthForm = ({
    isRegister,
    onSubmit,
    error,
    switchForm,
}: AuthFormProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Card
            style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 16,
                width: "100%",
            }}
        >
            <VStack space="md" style={{ padding: 16 }}>
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: "800",
                        textAlign: "center",
						padding: 10
                    }}
                >
                    {isRegister ? "Register" : "Login"}
                </Text>

                {isRegister && (
                    <VStack>
                        <Text style={{ color: "#A0A0A0", fontWeight: "500" }}>
                            Username
                        </Text>
                        <Input variant="underlined">
                            <InputField
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter username"
                                autoCapitalize="none"
                            />
                        </Input>
                    </VStack>
                )}

                <VStack>
                    <Text style={{ color: "#A0A0A0", fontWeight: "500" }}>
                        Email
                    </Text>
                    <Input variant="underlined">
                        <InputField
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter email"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </Input>
                </VStack>

                <VStack>
                    <Text style={{ color: "#A0A0A0", fontWeight: "500" }}>
                        Password
                    </Text>
                    <HStack style={{ alignItems: "center" }}>
                        <Input variant="underlined" style={{ flex: 1 }}>
                            <InputField
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter password (Min. 12 char)"
                                secureTextEntry={!showPassword}
                            />
                        </Input>
                        <Button onPress={() => setShowPassword(!showPassword)} style={{ backgroundColor: "transparent" }}>
                            <Icon
                                as={showPassword ? EyeClosed : Eye}
                                size="md"
                                color="#000"
                            />
                        </Button>
                    </HStack>
                </VStack>

                <Button
                    onPress={() => onSubmit(email, password, username)}
                    style={{ backgroundColor: "#1B9CFF", borderRadius: 8 }}
                >
                    <Text style={{ color: "white", fontWeight: "700" }}>
                        {isRegister ? "Register" : "Login"}
                    </Text>
                </Button>

                <Button variant="link" onPress={switchForm} style={{ marginTop: 10, marginBottom: 10 }}>
                    <Text style={{ color: "#1B9CFF", textAlign: "center" }}>
                        {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
                    </Text>
                </Button>

				{error && (
                    <Text style={{ color: "red", textAlign: "center" }}>
                        {error}
                    </Text>
                )}
            </VStack>
        </Card>
    );
};

export default function ProfileScreen() {
    const [isHovered, setIsHovered] = useState(false);
    const { width, height } = useWindowDimensions();
    const isLargeScreen = width >= 765;
    const isShortScreen = height < 750;
    const isMobileScreen = width < 600;

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [isRegister, setIsRegister] = useState(false);
    const [authError, setAuthError] = useState("");

    const LG = LinearGradient as unknown as React.ComponentType<LinearGradientProps>;

    useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(async (user) => {
			setCurrentUser(user);
			if (user) {
				try {
					const token = await user.getIdToken();
					const response = await server.get("/api/user", {
						headers: {
							'Authorization': `Bearer ${token}`
						}
					});
                    setUserData(response.data);
				} catch (error) {
					console.error('Failed to fetch user data:', error);
				}
			}
		});
		return unsubscribe;
	}, []);
	
	const handleAuth = async (email: string, password: string, username?: string) => {
		try {
			if (isRegister && username) {
				await server.post("/api/register", {
					email,
					password,
					username,
				});
				await signInWithEmailAndPassword(auth, email, password);
			} else {
				await signInWithEmailAndPassword(auth, email, password);
			}
			setAuthError('');
		} catch (error: any) {
			setAuthError(error.message);
		}
	};

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error: any) {
            Alert.alert("Logout Error", error.message);
        }
    };

    if (!currentUser) {
        return (
            <LinearGradient
                colors={["#00FFDD", "#1B9CFF"]}
                style={{ flex: 1, justifyContent: "center", padding: 24 }}
            >
                <AuthForm
                    isRegister={isRegister}
                    onSubmit={handleAuth}
                    error={authError}
                    switchForm={() => setIsRegister(!isRegister)}
                />
            </LinearGradient>
        );
    }

	if (!userData) {
		return (
			<LinearGradient
				colors={["#00FFDD", "#1B9CFF"]}
				style={{ flex: 1, justifyContent: "center", padding: 24 }}
			>
				<Text style={{ textAlign: "center", fontSize: 20, color: "white" }}>
					Loading data...
				</Text>
			</LinearGradient>
		);
	}

    if (userData) return (
        <LG
            colors={["#00FFDD", "#1B9CFF"]}
            start={{ x: isMobileScreen ? 0 : 1, y: 0 }}
            end={{ x: isMobileScreen ? 1 : 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <HStack
                    style={{
                        maxHeight: "100%",
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
                            marginTop: isMobileScreen ? 0 : -40,
                            marginBottom: isLargeScreen ? -20 : 10,
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
                            <AvatarFallbackText>{userData?.username}</AvatarFallbackText>
                            <AvatarImage
                                accessibilityLabel={userData?.username}
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
                                    {userData?.username || "FilmManager User"}
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
                                            padding: 0,
                                        }}
                                    >
                                        <InputField
                                            editable={false}
											value={userData?.username || "Fetching..."}
                                            style={{
                                                fontSize: 20,
                                                fontWeight: "600",
												color: "gray"
                                            }}
                                        />
                                    </Input>
                                </VStack>

								<VStack style={{ marginBottom: 10 }}>
                                    <Text
                                        style={{
                                            color: "#A0A0A0",
                                            fontWeight: "500",
                                            fontSize: 20,
                                        }}
                                    >
                                        Email
                                    </Text>

                                    <Input
                                        variant="underlined"
                                        style={{
                                            marginTop: 5,
                                            backgroundColor: "transparent",
                                            padding: 0,
                                        }}
                                    >
                                        <InputField
                                            editable={false}
                                            value={userData?.email || "Fetching..."}
                                            style={{
                                                fontSize: 20,
                                                fontWeight: "600",
												color: "gray"
                                            }}
                                        />
                                    </Input>
                                </VStack>

								{userData.points !== null ? (
									<VStack style={{ marginTop: 20 }}>
										<Text
											style={{
												textAlign: "center",
												fontSize: isLargeScreen ? 36 : 30,
												fontWeight: "800",
												color: "#1B9CFF",
												paddingTop: 15,
												marginBottom: isLargeScreen	? 15 : 0,
											}}
										>
											{userData.points}
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
								) : (
									<Text
										style={{
											textAlign: "center",
											color: "#A0A0A0",
											fontWeight: "500",
											fontSize: isLargeScreen ? 20 : 14,
										}}
									>
										Fetching points...
									</Text>
								)}
                            </VStack>
                        </Card>

                        <Button
                            onHoverIn={() => setIsHovered(true)}
                            onHoverOut={() => setIsHovered(false)}
                            onPress={handleLogout}
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
            </ScrollView>
        </LG>
    );
}