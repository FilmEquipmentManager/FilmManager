import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useWindowDimensions, ScrollView, Alert, Platform } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/ui/icon";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel } from "@/components/ui/checkbox";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { useAuth } from "@/app/contexts/AuthContext";
import { ShoppingCart, X, Check, Minus, Plus } from "lucide-react-native";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";
import server from "../../../networking";

interface Product {
    id: string;
    itemName: string;
    variant: string;
    pointsToRedeem: number;
    image?: string;
}

interface CartItem {
    product: Product;
    quantity: number;
    selected: boolean;
}

interface Voucher {
    id: string;
    label: string;
    discount: number;
}

const RedeemScreen = () => {
    const { width } = useWindowDimensions();
    const isMobileScreen = width < 680;
    const { userData } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [cartVisible, setCartVisible] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const vouchers: Voucher[] = [
        { id: "10OFF", label: "10% Off", discount: 0.1 },
        { id: "20OFF", label: "20% Off", discount: 0.2 },
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const dummyProducts: Product[] = [
            {
                id: "1",
                itemName: "Camera Tripod",
                variant: "Standard",
                pointsToRedeem: 120,
            }, {
                id: "2",
                itemName: "LED Light Panel",
                variant: "Compact",
                pointsToRedeem: 80,
            }, {
                id: "3",
                itemName: "Lavalier Microphone",
                variant: "Wireless",
                pointsToRedeem: 150,
            }, {
                id: "4",
                itemName: "DSLR Rig",
                variant: "Advanced",
                pointsToRedeem: 200,
            }
        ];

        setProducts(dummyProducts);
        setLoading(false);
    };

    const handleAddToCart = (product: Product) => {
        setCartItems((prev) => {
            const existing = prev.find(
                (item) => item.product.id === product.id
            );
            if (existing) return prev;
            return [...prev, { product, quantity: 1, selected: true }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCartItems((prev) =>
            prev.map((item) => {
                if (item.product.id === productId) {
                    const newQuantity = item.quantity + delta;
                    if (newQuantity < 1) return item;
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const toggleSelection = (productId?: string) => {
        if (!productId) {
            const allSelected = cartItems.every((item) => item.selected);
            setCartItems((prev) =>
                prev.map((item) => ({ ...item, selected: !allSelected }))
            );
        } else {
            setCartItems((prev) =>
                prev.map((item) =>
                    item.product.id === productId ? { ...item, selected: !item.selected } : item
                )
            );
        }
    };

    const calculateTotal = () => {
        const subtotal = cartItems.filter((item) => item.selected).reduce((sum, item) => sum + item.product.pointsToRedeem * item.quantity, 0);

        const discount = selectedVoucher ? subtotal * selectedVoucher.discount : 0;

        return { subtotal, discount, total: subtotal - discount };
    };

    const handleCheckout = async () => {
        const { total } = calculateTotal();

        if (total > (userData?.points || 0)) {
            showToast("Error", "Insufficient points");
            return;
        }

        try {
            await server.put("/api/updateUserPoints", {
                username: userData?.username,
                points: (userData?.points || 0) - total,
            });

            setCartItems([]);
            setSelectedVoucher(null);
            setCartVisible(false);
            showToast("Success", "Redemption successful!");
        } catch (error) {
            showToast("Error", "Checkout failed");
        }
    };

    const showToast = (title: string, description: string) => {
        toast.show({
            placement: "top",
            render: () => (
                <Toast action="muted" variant="solid">
                    <ToastTitle>{title}</ToastTitle>
                    <ToastDescription>{description}</ToastDescription>
                </Toast>
            ),
        });
    };

    return (
        <ProtectedRoute>
            <LinearGradient
                colors={isMobileScreen ? ["#00FFDD", "#1B9CFF"] : ["#1B9CFF", "#00FFDD"]}
                start={{ x: 0, y: 0 }}
                end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1, width: "100%", height: "100%" }}>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <HStack
                            style={{
                                marginBottom: 20,
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    color: "white",
                                    padding: 10
                                }}
                            >
                                Film Equipment Redemption
                            </Text>
                            <Button
                                onPress={() => setCartVisible(true)}
                                style={{ position: "relative" }}
                            >
                                <Icon
                                    as={ShoppingCart}
                                    color="white"
                                    size="xl"
                                />
                                {cartItems.length > 0 && (
                                    <Text
                                        style={{
                                            position: "absolute",
                                            top: -8,
                                            right: -8,
                                            backgroundColor: "#EF4444",
                                            color: "white",
                                            paddingHorizontal: 8,
                                            borderRadius: 999,
                                        }}
                                    >
                                        {cartItems.length}
                                    </Text>
                                )}
                            </Button>
                        </HStack>

                        {loading ? (
                            <Spinner size="large" />
                        ) : (
                            <VStack
                                style={{
                                    flexWrap: "wrap",
                                    flexDirection: "row",
                                    justifyContent: "center",
                                }}
                            >
                                {products.map((product) => (
                                    <Card
                                        key={product.id}
                                        style={{
                                            width: "100%",
                                            margin: 8,
                                        }}
                                    >
                                        <VStack style={{ padding: 16 }}>
                                            <Text
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {product.itemName}
                                            </Text>
                                            <Text style={{ color: "#718096" }}>
                                                {product.variant}
                                            </Text>

                                            <HStack
                                                style={{
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 16,
                                                        fontWeight: "bold",
                                                        color: "#1E40AF",
                                                    }}
                                                >
                                                    {product.pointsToRedeem} pts
                                                </Text>
                                                {cartItems.some(
                                                    (item) => item.product.id === product.id) ? (
                                                        <HStack
                                                            style={{
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                                gap: 8,
                                                            }}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                onPress={() => updateQuantity(product.id, -1)}
                                                            >
                                                                <Icon
                                                                    as={Minus}
                                                                    size="md"
                                                                />
                                                            </Button>
                                                            <Text>
                                                                {cartItems.find((item) => item.product.id === product.id)?.quantity}
                                                            </Text>
                                                            <Button
                                                                size="sm"
                                                                onPress={() => updateQuantity(product.id, 1)}
                                                            >
                                                                <Icon
                                                                    as={Plus}
                                                                    size="md"
                                                                />
                                                            </Button>
                                                        </HStack>
                                                    ) : (
                                                        <Button
                                                            onPress={() => handleAddToCart(product)}
                                                        >
                                                            <Text
                                                                style={{
                                                                    color: "white",
                                                                }}
                                                            >
                                                                Add to Cart
                                                            </Text>
                                                        </Button>
                                                    )
                                                }
                                            </HStack>
                                        </VStack>
                                    </Card>
                                ))}
                            </VStack>
                        )}
                    </ScrollView>

                    {cartVisible && (
                        <VStack
                            style={{
                                position: Platform.OS === "web" ? "fixed" : "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: "white",
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                padding: 16,
                                maxHeight: "80%",
                            }}
                        >
                            <HStack
                                style={{
                                    marginBottom: 16,
                                    justifyContent: "space-between",
                                }}
                            >
                                <Text
                                    style={{ fontSize: 20, fontWeight: "bold" }}
                                >
                                    Cart
                                </Text>
                                <Button onPress={() => setCartVisible(false)}>
                                    <Icon as={X} size="xl" />
                                </Button>
                            </HStack>

                            <ScrollView>
                                <Checkbox
                                    value="all"
                                    onChange={() => toggleSelection()}
                                    isChecked={cartItems.every((item) => item.selected)}
                                    style={{ marginBottom: 16 }}
                                >
                                    <CheckboxIndicator
                                        style={{ marginRight: 8 }}
                                    >
                                        <CheckboxIcon as={Check} />
                                    </CheckboxIndicator>
                                    <CheckboxLabel>Select All</CheckboxLabel>
                                </Checkbox>

                                {cartItems.map((item) => (
                                    <Card
                                        key={item.product.id}
                                        style={{ marginBottom: 8 }}
                                    >
                                        <HStack
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 12,
                                            }}
                                        >
                                            <Checkbox
                                                value={item.product.id}
                                                isChecked={item.selected}
                                                onChange={() => toggleSelection(item.product.id)}
                                            >
                                                <CheckboxIndicator
                                                    style={{ marginRight: 8 }}
                                                >
                                                    <CheckboxIcon as={Check} />
                                                </CheckboxIndicator>
                                            </Checkbox>
                                            <VStack style={{ flex: 1 }}>
                                                <Text
                                                    style={{
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {item.product.itemName}
                                                </Text>
                                                <Text
                                                    style={{ color: "#718096" }}
                                                >
                                                    Qty: {item.quantity}
                                                </Text>
                                                <Text
                                                    style={{ color: "#1E40AF" }}
                                                >
                                                    {item.product.pointsToRedeem * item.quantity}{" "} pts
                                                </Text>
                                            </VStack>
                                            <Button
                                                variant="link"
                                                onPress={() =>
                                                    updateQuantity(item.product.id, -item.quantity)
                                                }
                                            >
                                                <Icon as={X} color="#EF4444" />
                                            </Button>
                                        </HStack>
                                    </Card>
                                ))}

                                <VStack style={{ marginTop: 16 }}>
                                    {vouchers.map((voucher) => (
                                        <Button
                                            key={voucher.id}
                                            variant={
                                                selectedVoucher?.id === voucher.id ? "solid" : "outline"
                                            }
                                            onPress={() =>
                                                setSelectedVoucher(voucher)
                                            }
                                        >
                                            <Text>{voucher.label}</Text>
                                        </Button>
                                    ))}
                                </VStack>

                                <VStack style={{ marginTop: 24 }}>
                                    <HStack
                                        style={{
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Text>Subtotal:</Text>
                                        <Text>
                                            {calculateTotal().subtotal} pts
                                        </Text>
                                    </HStack>
                                    <HStack
                                        style={{
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Text>Discount:</Text>
                                        <Text style={{ color: "#EF4444" }}>
                                            -{calculateTotal().discount} pts
                                        </Text>
                                    </HStack>
                                    <HStack
                                        style={{
                                            justifyContent: "space-between",
                                            marginTop: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontWeight: "bold",
                                            }}
                                        >
                                            Total:
                                        </Text>
                                        <Text
                                            style={{
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {calculateTotal().total} pts
                                        </Text>
                                    </HStack>
                                </VStack>
                            </ScrollView>

                            <Button
                                onPress={handleCheckout}
                                style={{ marginTop: 16 }}
                            >
                                <Text style={{ color: "white" }}>
                                    Checkout ({calculateTotal().total} pts)
                                </Text>
                            </Button>
                        </VStack>
                    )}
                </SafeAreaView>
            </LinearGradient>
        </ProtectedRoute>
    );
};

export default RedeemScreen;