// ProtectedRoute.tsx
import { useAuth } from "../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Film, LogInIcon } from "lucide-react-native";
import { auth } from "@/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Input, InputField } from "@/components/ui/input";
import { Eye, EyeClosed } from "lucide-react-native";
import server from "../../networking";

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

export default function ProtectedRoute({ showAuth, children }: { showAuth?: boolean; children: React.ReactNode | ((userData: any) => React.ReactNode) }) {
    const [isRegister, setIsRegister] = useState(false);
    const [authError, setAuthError] = useState("");

    const { userData, loading } = useAuth();

    const router = useRouter();

    const handleAuth = async (email: string, password: string, username?: string) => {
		try {
			if (isRegister && username) {
				await server.post("/api/register", {
					email,
					password,
					username,
				});
				await signInWithEmailAndPassword(auth, email, password);

                setAuthError('');
			} else {
				await signInWithEmailAndPassword(auth, email, password);

                setAuthError('');
			}
		} catch (error: any) {
			setAuthError(error.message);
		}
	};

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
        if (showAuth) {
            return (
                <LinearGradient
                    colors={["#00FFDD", "#1B9CFF"]}
                    style={{ flex: 1, justifyContent: "center", padding: 24 }}
                >
                    <AuthForm
                        isRegister={isRegister}
                        onSubmit={handleAuth as any}
                        error={authError}
                        switchForm={() => setIsRegister(!isRegister)}
                    />
                </LinearGradient>
            );
        } else {
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
    } else {
        return typeof children === 'function' ? children(userData) : children;
    }
}