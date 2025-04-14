import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { LinearGradient } from "expo-linear-gradient";
import { Spinner } from "@/components/ui/spinner";
import { useAuth, ProtectedRoute } from "../../contexts/AuthContext";
import Constants from "expo-constants";
import server from "../../../networking";

interface ScannedItem {
    id: string;
    value: string;
    timestamp: string;
}

export default function ScannerScreen() {
    const [currentScan, setCurrentScan] = useState("");
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef<any>(null);

    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const { userData, loading } = useAuth();

    const BASE_URL = Constants.expoConfig?.extra?.BASE_URL;

    const showToast = (title, description) => {
        const newId = Math.random();
        setToastId(newId);
        toast.show({
            id: newId.toString(),
            placement: "top",
            duration: 3000,
            render: ({ id }) => {
                const uniqueToastId = "toast-" + id;
                return (
                    <Toast
                        nativeID={uniqueToastId}
                        action="muted"
                        variant="solid"
                    >
                        <ToastTitle>{title}</ToastTitle>
                        <ToastDescription>{description}</ToastDescription>
                    </Toast>
                );
            },
        });
    };

    useEffect(() => {
        const socket = io(BASE_URL, {
            path: "/socket.io",
            transports: ["websocket"],
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            if (!toast.isActive(toastId.toString())) {
                showToast(
                    "Socket connection error",
                    "Please check your internet connection and try again."
                );
            }
        });

        socket.on("barcodes_updated", (barcodes: ScannedItem[]) => {
            setScannedItems(barcodes);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        const MIN_BARCODE_LENGTH = 6;
        if (currentScan.trim().length < MIN_BARCODE_LENGTH) return;

        const timeout = setTimeout(() => {
            handleScanSubmit();
        }, 100);

        return () => clearTimeout(timeout);
    }, [currentScan]);

    const handleScanSubmit = async () => {
        if (currentScan.trim()) {
            setIsLoading(true);
            try {
                await server.post("/api/barcodes", {
                    barcode: currentScan.trim(),
                });
                setCurrentScan("");
            } catch (error) {
                console.error("Error submitting barcode:", error);
            } finally {
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 10);
            }
        }
    };

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    if (loading) {
        return (
          <LinearGradient
            colors={["#1B9CFF", "#00FFDD"]}
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Spinner size="large" />
          </LinearGradient>
        );
    }

    return (
        <ProtectedRoute>
            <VStack
                style={{
                    flex: 1,
                    padding: 16,
                    gap: 16,
                    backgroundColor: "$background",
                }}
            >
                <Input isDisabled={isLoading}>
                    <InputField
                        ref={inputRef}
                        placeholder="Scan barcode..."
                        value={currentScan}
                        onChangeText={(text) => {
                            setCurrentScan(text);
                            if (text.endsWith("\n")) {
                                setCurrentScan(text.trim());
                                handleScanSubmit();
                            }
                        }}
                        onSubmitEditing={handleScanSubmit}
                        returnKeyType="done"
                        showSoftInputOnFocus={false}
                        onBlur={() => inputRef.current?.focus()}
                        style={{ height: 40, width: "100%" }}
                    />
                </Input>

                <ScrollView style={{ flex: 1, width: "100%" }}>
                    <VStack style={{ gap: 8, paddingBottom: 16 }}>
                        {scannedItems.length > 0 ? (
                            scannedItems.map((item) => (
                                <HStack
                                    key={item.id}
                                    style={{
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        width: "100%",
                                    }}
                                >
                                    <Text
                                        style={{ fontSize: 16, fontWeight: "bold" }}
                                    >
                                        {item.value}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            color: "$gray11",
                                        }}
                                    >
                                        {formatDate(item.timestamp)}
                                    </Text>
                                </HStack>
                            ))
                        ) : (
                            <Text style={{ color: "$gray11" }}>
                                Scan results will appear here
                            </Text>
                        )}
                    </VStack>
                </ScrollView>
            </VStack>
        </ProtectedRoute>
    );
}