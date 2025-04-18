import { useState, useEffect, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useWindowDimensions, ScrollView, Pressable } from "react-native";
import React from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Modal, ModalBackdrop, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox, CheckboxIndicator, CheckboxIcon } from "@/components/ui/checkbox";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart, X, Check, Minus, Plus, TagIcon, Disc, Camera, AlertCircle, CheckCircle2 } from "lucide-react-native";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";
import server from "../../../networking";

interface Product {
    id: string;
    itemName: string;
    variant: string;
    pointsToRedeem: number;
    image?: string;
    description?: string;
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
    minSpend?: number;
    expiresAt?: string;
}

export default function RedeemScreen () {
    const { width } = useWindowDimensions();
    const isMobileScreen = width < 680;
    const { userData } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
    const [addedToCartId, setAddedToCartId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [cartModalVisible, setCartModalVisible] = useState(false);
    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [voucherModalVisible, setVoucherModalVisible] = useState(false);
    const [confirmCheckoutVisible, setConfirmCheckoutVisible] = useState(false);
    const toast = useToast();

    const vouchers: Voucher[] = [
        { id: "10OFF", label: "10% Off", discount: 0.1 },
        { id: "20OFF", label: "20% Off", discount: 0.2, minSpend: 100 },
        { id: "30OFF", label: "30% Off", discount: 0.3, minSpend: 250, expiresAt: "Dec 31" },
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const dummyProducts: Product[] = [
            {
                id: "1",
                itemName: "Camera Tripod",
                variant: "Black",
                pointsToRedeem: 120,
            },
            {
                id: "2",
                itemName: "LED Light Panel",
                variant: "White",
                pointsToRedeem: 80,
            },
            {
                id: "3",
                itemName: "Lavalier Microphone",
                variant: "Blue",
                pointsToRedeem: 150,
            },
            {
                id: "4",
                itemName: "DSLR Rig",
                variant: "Mini",
                pointsToRedeem: 200,
            },
            {
                id: "5",
                itemName: "DSLR Rig",
                variant: "Mini",
                pointsToRedeem: 200,
            },
            {
                id: "6",
                itemName: "DSLR Rig",
                variant: "Mini",
                pointsToRedeem: 200,
            },
            {
                id: "7",
                itemName: "DSLR Rig",
                variant: "Mini",
                pointsToRedeem: 200,
            },
            {
                id: "8",
                itemName: "DSLR Rig",
                variant: "Mini",
                pointsToRedeem: 200,
            },
            {
                id: "9",
                itemName: "DSLR Rig",
                variant: "Mini",
                pointsToRedeem: 200,
            },
            {
                id: "10",
                itemName: "DSLR Rig",
                variant: "Mini",
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

    const removeFromCart = (productId: string) => {
        setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCartItems((prev) =>
            prev.map((item) => {
                if (item.product.id === productId) {
                    const newQuantity = item.quantity + delta;
                    if (newQuantity < 1) return null;

                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(item => item !== null)
        );
    };

    const selectedItems = useMemo(() => 
        cartItems.filter(item => item.selected), 
        [cartItems]
    );
      
    const toggleSelection = (productId?: string) => {
        if (!productId) {
          const allSelected = cartItems.every((item) => item.selected);
          setCartItems((prev) =>
            prev.map((item) => ({ ...item, selected: !allSelected }))
          );
        } else {
          setCartItems((prev) =>
            prev.map((item) =>
              item.product.id === productId
                ? { ...item, selected: !item.selected }
                : item
            )
          );
        }
    };

    const calculateTotal = () => {
        const subtotal = cartItems
            .filter((item) => item.selected)
            .reduce(
                (sum, item) =>
                    sum + item.product.pointsToRedeem * item.quantity,
                0
            );

        const discount = selectedVoucher
            ? subtotal * selectedVoucher.discount
            : 0;

        return { subtotal, discount, total: subtotal - discount };
    };

    // Calculate total number of items (sum of all quantities)
    const getTotalItemsCount = () => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
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
            setCartModalVisible(false);
            setConfirmCheckoutVisible(false);
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
                colors={["#F0FDF4", "#ECFEFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <HStack
                        style={{
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: "#E2E8F0",
                        }}
                    >
                        <VStack>
                            <Heading size="lg" style={{ color: "#166534" }}>
                                Equipment Redemption
                            </Heading>
                            <HStack
                                space="xs"
                                style={{ alignItems: "center", marginTop: 4 }}
                            >
                                <Icon
                                    as={Disc}
                                    size="sm"
                                    style={{ color: "#059669" }}
                                />
                                <Text
                                    style={{
                                        color: "#059669",
                                        fontWeight: "medium",
                                    }}
                                >
                                    Available Points: {userData?.points || 0}
                                </Text>
                            </HStack>
                        </VStack>

                        <Button
                            onPress={() => setCartModalVisible(true)}
                            variant={cartItems.length > 0 ? "solid" : "outline"}
                            style={{
                                borderRadius: 12,
                                backgroundColor: "transparent",
                                borderColor: "#10B981",
                                borderWidth: 2
                            }}
                        >
                            <Box style={{ alignItems: "center", display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                <Box style={{ marginRight: cartItems.length > 0 ? 5 : 0 }}>
                                    <Icon
                                        as={ShoppingCart}
                                        size="md"
                                        style={{
                                            color: "#10B981"
                                        }}
                                    />
                                </Box>

                                {cartItems.length > 0 && (
                                    <Badge
                                        variant="solid"
                                        style={{
                                            backgroundColor: "#10B981",
                                            borderRadius: 20,
                                            minWidth: 24,
                                            height: 24,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginLeft: 5
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: "white",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {getTotalItemsCount()}
                                        </Text>
                                    </Badge>
                                )}
                            </Box>
                        </Button>
                    </HStack>

                    {/* Main Content */}
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {loading ? (
                            <Box style={{ padding: 40, alignItems: "center" }}>
                                <Spinner size="large" color="#10B981" />
                                <Text
                                    style={{ marginTop: 16, color: "#6B7280" }}
                                >
                                    Loading available equipment...
                                </Text>
                            </Box>
                        ) : (
                            <VStack space="lg">
                                {products.map((product) => (
                                    <Card
                                        key={product.id}
                                        style={{
                                            padding: 16,
                                            borderRadius: 16,
                                            backgroundColor: "white",
                                            shadowColor: "#000",
                                            shadowOffset: {
                                                width: 0,
                                                height: 2,
                                            },
                                            shadowOpacity: 0.05,
                                            shadowRadius: 4,
                                            elevation: 2,
                                            borderWidth:
                                                addedToCartId === product.id
                                                    ? 2
                                                    : 0,
                                            borderColor: "#10B981",
                                        }}
                                    >
                                        <HStack space="md">
                                            {/* Product Image */}
                                            <Box
                                                style={{
                                                    width: 100,
                                                    height: 100,
                                                    borderRadius: 8,
                                                    backgroundColor: "#F9FAFB",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {product.image ? (
                                                    <Avatar
                                                        size="xl"
                                                        style={{
                                                            width: 100,
                                                            height: 100,
                                                        }}
                                                    >
                                                        <AvatarImage
                                                            style={{
                                                                width: 100,
                                                                height: 100,
                                                            }}
                                                            source={{
                                                                uri: `/api/placeholder/100/100`,
                                                            }}
                                                            alt={`${product.itemName} image`}
                                                        />
                                                    </Avatar>
                                                ) : (
                                                    <Icon
                                                        as={Camera}
                                                        size="xl"
                                                        style={{
                                                            color: "#9CA3AF",
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Product Info */}
                                            <VStack
                                                space="xs"
                                                style={{
                                                    flex: 1,
                                                    justifyContent:
                                                        "space-between",
                                                }}
                                            >
                                                <VStack>
                                                    <HStack
                                                        space="xs"
                                                        style={{
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 18,
                                                                fontWeight:
                                                                    "bold",
                                                                color: "#111827",
                                                            }}
                                                        >
                                                            {product.itemName}
                                                        </Text>
                                                    </HStack>

                                                    <Text
                                                        style={{
                                                            color: "#4B5563",
                                                            marginTop: 4,
                                                        }}
                                                    >
                                                        {product.description ||
                                                            "High-quality equipment for film production"}
                                                    </Text>
                                                </VStack>

                                                <HStack
                                                    style={{
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                        marginTop: 8,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 16,
                                                            fontWeight: "bold",
                                                            color: "#059669",
                                                        }}
                                                    >
                                                        {product.pointsToRedeem}{" "}
                                                        points
                                                    </Text>

                                                    {cartItems.some(
                                                        (i) =>
                                                            i.product.id ===
                                                            product.id
                                                    ) ? (
                                                        <HStack
                                                            space="md"
                                                            style={{
                                                                alignItems:
                                                                    "center",
                                                                backgroundColor:
                                                                    "#F3F4F6",
                                                                borderRadius: 8,
                                                                padding: 4,
                                                            }}
                                                        >
                                                            <Pressable
                                                                onPress={() =>
                                                                    updateQuantity(
                                                                        product.id,
                                                                        -1
                                                                    )
                                                                }
                                                                style={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius: 16,
                                                                    padding: 0,
                                                                    justifyContent:
                                                                        "center",
                                                                    alignItems:
                                                                        "center",
                                                                }}
                                                            >
                                                                <Icon
                                                                    as={Minus}
                                                                    size="sm"
                                                                    style={{
                                                                        color: "#6B7280",
                                                                    }}
                                                                />
                                                            </Pressable>

                                                            <Text
                                                                style={{
                                                                    fontWeight:
                                                                        "medium",
                                                                    width: 24,
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            >
                                                                {
                                                                    cartItems.find(
                                                                        (i) =>
                                                                            i
                                                                                .product
                                                                                .id ===
                                                                            product.id
                                                                    )?.quantity
                                                                }
                                                            </Text>

                                                            <Pressable
                                                                onPress={() =>
                                                                    updateQuantity(
                                                                        product.id,
                                                                        1
                                                                    )
                                                                }
                                                                style={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    borderRadius: 16,
                                                                    padding: 0,
                                                                    justifyContent:
                                                                        "center",
                                                                    alignItems:
                                                                        "center",
                                                                }}
                                                            >
                                                                <Icon
                                                                    as={Plus}
                                                                    size="sm"
                                                                    style={{
                                                                        color: "#6B7280",
                                                                    }}
                                                                />
                                                            </Pressable>
                                                        </HStack>
                                                    ) : (
                                                        <Button
                                                            onPress={() =>
                                                                handleAddToCart(
                                                                    product
                                                                )
                                                            }
                                                            style={{
                                                                backgroundColor:
                                                                    "#10B981",
                                                                borderRadius: 8,
                                                                paddingHorizontal: 16,
                                                            }}
                                                        >
                                                            <HStack
                                                                space="xs"
                                                                style={{
                                                                    alignItems:
                                                                        "center",
                                                                }}
                                                            >
                                                                <Icon
                                                                    as={
                                                                        ShoppingCart
                                                                    }
                                                                    size="sm"
                                                                    style={{
                                                                        color: "white",
                                                                    }}
                                                                />
                                                                <Text
                                                                    style={{
                                                                        color: "white",
                                                                        fontWeight:
                                                                            "medium",
                                                                        marginLeft: 3
                                                                    }}
                                                                >
                                                                    Add to Cart
                                                                </Text>
                                                            </HStack>
                                                        </Button>
                                                    )}
                                                </HStack>
                                            </VStack>
                                        </HStack>
                                    </Card>
                                ))}
                            </VStack>
                        )}
                    </ScrollView>

                    {/* Cart Modal */}
                    <Modal
                        isOpen={cartModalVisible}
                        onClose={() => setCartModalVisible(false)}
                        size={isMobileScreen ? "full" : "md"}
                        style={{ paddingHorizontal: 15, paddingVertical: 100 }}
                    >
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                                <Heading size="lg">Cart</Heading>
                            </ModalHeader>

                            <ModalBody style={{ paddingRight: 10, marginLeft: 10 }}>
                                {cartItems.length === 0 ? (
                                    <VStack
                                        space="md"
                                        style={{
                                            alignItems: "center",
                                            padding: 24,
                                        }}
                                    >
                                        <Icon
                                            as={ShoppingCart}
                                            size="xl"
                                            style={{ color: "#D1D5DB" }}
                                        />
                                        <Text
                                            style={{
                                                color: "#6B7280",
                                                textAlign: "center",
                                            }}
                                        >
                                            Your cart is empty. Add items to get
                                            started.
                                        </Text>
                                        <Button
                                            onPress={() =>
                                                setCartModalVisible(false)
                                            }
                                            style={{ marginTop: 8, backgroundColor: "#10B981" }}
                                        >
                                            <Text style={{ color: "white" }}>Browse Equipment</Text>
                                        </Button>
                                    </VStack>
                                ) : (
                                    <>
                                        <VStack
                                            space="md"
                                            style={{ marginBottom: 16 }}
                                        >
                                            {cartItems.map((item) => (
                                                <Card
                                                    key={item.product.id}
                                                    style={{
                                                        padding: 12,
                                                        borderRadius: 12,
                                                        backgroundColor:
                                                            item.selected
                                                                ? "#ECFDF5"
                                                                : "white",
                                                        borderWidth: 1,
                                                        borderColor:
                                                            item.selected
                                                                ? "#10B981"
                                                                : "#E5E7EB",
                                                    }}
                                                >
                                                    <HStack
                                                        space="md"
                                                        style={{
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <Checkbox
                                                            value={
                                                                item.product.id
                                                            }
                                                            isChecked={
                                                                item.selected
                                                            }
                                                            onChange={() =>
                                                                toggleSelection(
                                                                    item.product
                                                                        .id
                                                                )
                                                            }
                                                        >
                                                            <CheckboxIndicator
                                                                style={{
                                                                    marginRight: 8,
                                                                }}
                                                            >
                                                                <CheckboxIcon
                                                                    as={Check}
                                                                />
                                                            </CheckboxIndicator>
                                                        </Checkbox>

                                                        <Box
                                                            style={{
                                                                width: 50,
                                                                height: 50,
                                                                borderRadius: 6,
                                                                backgroundColor:
                                                                    "#F9FAFB",
                                                                justifyContent:
                                                                    "center",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            <Icon
                                                                as={Camera}
                                                                size="md"
                                                                style={{
                                                                    color: "#9CA3AF",
                                                                }}
                                                            />
                                                        </Box>

                                                        <VStack
                                                            style={{ flex: 1 }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontWeight:
                                                                        "medium",
                                                                    color: "#111827",
                                                                }}
                                                            >
                                                                {
                                                                    item.product
                                                                        .itemName
                                                                }
                                                            </Text>
                                                            <Text
                                                                style={{
                                                                    color: "#6B7280",
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                {
                                                                    item.product
                                                                        .variant
                                                                }
                                                            </Text>

                                                            <HStack
                                                                style={{
                                                                    justifyContent:
                                                                        "space-between",
                                                                    marginTop: 4,
                                                                }}
                                                            >
                                                                <HStack
                                                                    space="sm"
                                                                    style={{
                                                                        alignItems:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <Pressable
                                                                        onPress={() =>
                                                                            updateQuantity(
                                                                                item
                                                                                    .product
                                                                                    .id,
                                                                                -1
                                                                            )
                                                                        }
                                                                    >
                                                                        <Icon
                                                                            as={
                                                                                Minus
                                                                            }
                                                                            size="xs"
                                                                            style={{
                                                                                color: "#6B7280",
                                                                            }}
                                                                        />
                                                                    </Pressable>

                                                                    <Text
                                                                        style={{
                                                                            width: 20,
                                                                            textAlign:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                    </Text>

                                                                    <Pressable
                                                                        onPress={() =>
                                                                            updateQuantity(
                                                                                item
                                                                                    .product
                                                                                    .id,
                                                                                1
                                                                            )
                                                                        }
                                                                    >
                                                                        <Icon
                                                                            as={
                                                                                Plus
                                                                            }
                                                                            size="xs"
                                                                            style={{
                                                                                color: "#6B7280",
                                                                            }}
                                                                        />
                                                                    </Pressable>
                                                                </HStack>

                                                                <Text
                                                                    style={{
                                                                        fontWeight: "medium",
                                                                        color: "#059669"
                                                                    }}
                                                                >
                                                                    {item
                                                                        .product
                                                                        .pointsToRedeem *
                                                                        item.quantity}{" "}
                                                                    pts
                                                                </Text>
                                                            </HStack>
                                                        </VStack>

                                                        <Pressable
                                                            onPress={() =>
                                                                removeFromCart(
                                                                    item.product
                                                                        .id
                                                                )
                                                            }
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 16,
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <Icon
                                                                as={X}
                                                                size="sm"
                                                                style={{
                                                                    color: "#6B7280",
                                                                }}
                                                            />
                                                        </Pressable>
                                                    </HStack>
                                                </Card>
                                            ))}
                                        </VStack>

                                        {/* Order Summary */}
                                        <Card
                                            style={{
                                                padding: 16,
                                                borderRadius: 12,
                                                backgroundColor: "#F9FAFB",
                                                marginBottom: 16,
                                            }}
                                        >
                                            <VStack space="sm">
                                                <HStack
                                                    style={{
                                                        justifyContent:
                                                            "space-between",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontWeight: "bold",
                                                            color: "#111827",
                                                        }}
                                                    >
                                                        Subtotal:
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontWeight: "bold",
                                                            color: "#ee4d2d",
                                                            fontSize: 16,
                                                        }}
                                                    >
                                                        {calculateTotal().total}{" "}
                                                        pts
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                        </Card>
                                    </>
                                )}
                            </ModalBody>

                            {cartItems.length > 0 && (
                                <ModalFooter style={{ paddingRight: 10, marginLeft: 10 }}>
                                    <HStack
                                        space="md"
                                        style={{ width: "100%" }}
                                    >
                                        <Button
                                            variant="outline"
                                            style={{
                                                flex: 1,
                                                borderColor: "#6B7280",
                                            }}
                                            onPress={() => setCartModalVisible(false)}
                                        >
                                            <Text style={{ color: "#6B7280" }}>
                                                Continue Shopping
                                            </Text>
                                        </Button>

                                        <Button
                                            style={{
                                                flex: 1,
                                                backgroundColor:
                                                    calculateTotal().total >
                                                    (userData?.points || 0)
                                                        ? "#9CA3AF"
                                                        : "#10B981",
                                            }}
                                            onPress={() => {
                                                setCartModalVisible(false)
                                                setCheckoutModalVisible(true)
                                            }}
                                            disabled={
                                                calculateTotal().total >
                                                (userData?.points || 0)
                                            }
                                        >
                                            <Text
                                                style={{
                                                    color: "white",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Checkout
                                            </Text>
                                        </Button>
                                    </HStack>
                                </ModalFooter>
                            )}
                        </ModalContent>
                    </Modal>

                    {/* Checkout Modal */}
                    <Modal
                        isOpen={checkoutModalVisible}
                        onClose={() => setCheckoutModalVisible(false)}
                        size={isMobileScreen ? "full" : "md"}
                        style={{ paddingHorizontal: 15, paddingVertical: 100 }}
                    >
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                                <Heading size="lg">Checkout</Heading>
                            </ModalHeader>

                            <ModalBody style={{ paddingRight: 10, marginLeft: 10 }}>
                                {selectedItems.length === 0 ? (
                                    <VStack
                                        space="md"
                                        style={{
                                            alignItems: "center",
                                            padding: 24,
                                        }}
                                    >
                                        <Icon
                                            as={ShoppingCart}
                                            size="xl"
                                            style={{ color: "#D1D5DB" }}
                                        />
                                        <Text
                                            style={{
                                                color: "#6B7280",
                                                textAlign: "center",
                                            }}
                                        >
                                            You have nothing to checkout.
                                        </Text>
                                        <Button
                                            onPress={() =>{
                                                setCheckoutModalVisible(false)
                                                setCartModalVisible(true)
                                            }}
                                            style={{ marginTop: 8, backgroundColor: "#10B981" }}
                                        >
                                            <Text style={{ color: "white" }}>Go back to cart</Text>
                                        </Button>
                                    </VStack>
                                ) : (
                                    <>
                                        <VStack
                                            space="md"
                                            style={{ marginBottom: 16 }}
                                        >
                                            {selectedItems.map((item) => (
                                                <Card
                                                    key={item.product.id}
                                                    style={{
                                                        padding: 12,
                                                        borderRadius: 12,
                                                        backgroundColor:
                                                            item.selected
                                                                ? "#ECFDF5"
                                                                : "white",
                                                        borderWidth: 1,
                                                        borderColor:
                                                            item.selected
                                                                ? "#10B981"
                                                                : "#E5E7EB",
                                                    }}
                                                >
                                                    <HStack
                                                        space="md"
                                                        style={{
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <Checkbox
                                                            value={
                                                                item.product.id
                                                            }
                                                            isChecked={
                                                                item.selected
                                                            }
                                                            onChange={() =>
                                                                toggleSelection(
                                                                    item.product
                                                                        .id
                                                                )
                                                            }
                                                        >
                                                            <CheckboxIndicator
                                                                style={{
                                                                    marginRight: 8,
                                                                }}
                                                            >
                                                                <CheckboxIcon
                                                                    as={Check}
                                                                />
                                                            </CheckboxIndicator>
                                                        </Checkbox>

                                                        <Box
                                                            style={{
                                                                width: 50,
                                                                height: 50,
                                                                borderRadius: 6,
                                                                backgroundColor:
                                                                    "#F9FAFB",
                                                                justifyContent:
                                                                    "center",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            <Icon
                                                                as={Camera}
                                                                size="md"
                                                                style={{
                                                                    color: "#9CA3AF",
                                                                }}
                                                            />
                                                        </Box>

                                                        <VStack
                                                            style={{ flex: 1 }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontWeight:
                                                                        "medium",
                                                                    color: "#111827",
                                                                }}
                                                            >
                                                                {
                                                                    item.product
                                                                        .itemName
                                                                }
                                                            </Text>
                                                            <Text
                                                                style={{
                                                                    color: "#6B7280",
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                {
                                                                    item.product
                                                                        .variant
                                                                }
                                                            </Text>

                                                            <HStack
                                                                style={{
                                                                    justifyContent:
                                                                        "space-between",
                                                                    marginTop: 4,
                                                                }}
                                                            >
                                                                <HStack
                                                                    space="sm"
                                                                    style={{
                                                                        alignItems:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <Pressable
                                                                        onPress={() =>
                                                                            updateQuantity(
                                                                                item
                                                                                    .product
                                                                                    .id,
                                                                                -1
                                                                            )
                                                                        }
                                                                    >
                                                                        <Icon
                                                                            as={
                                                                                Minus
                                                                            }
                                                                            size="xs"
                                                                            style={{
                                                                                color: "#6B7280",
                                                                            }}
                                                                        />
                                                                    </Pressable>

                                                                    <Text
                                                                        style={{
                                                                            width: 20,
                                                                            textAlign:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                    </Text>

                                                                    <Pressable
                                                                        onPress={() =>
                                                                            updateQuantity(
                                                                                item
                                                                                    .product
                                                                                    .id,
                                                                                1
                                                                            )
                                                                        }
                                                                    >
                                                                        <Icon
                                                                            as={
                                                                                Plus
                                                                            }
                                                                            size="xs"
                                                                            style={{
                                                                                color: "#6B7280",
                                                                            }}
                                                                        />
                                                                    </Pressable>
                                                                </HStack>

                                                                <Text
                                                                    style={{
                                                                        fontWeight: "medium",
                                                                        color: "#059669"
                                                                    }}
                                                                >
                                                                    {item
                                                                        .product
                                                                        .pointsToRedeem *
                                                                        item.quantity}{" "}
                                                                    pts
                                                                </Text>
                                                            </HStack>
                                                        </VStack>

                                                        <Pressable
                                                            onPress={() =>
                                                                removeFromCart(
                                                                    item.product
                                                                        .id
                                                                )
                                                            }
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 16,
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <Icon
                                                                as={X}
                                                                size="sm"
                                                                style={{
                                                                    color: "#6B7280",
                                                                }}
                                                            />
                                                        </Pressable>
                                                    </HStack>
                                                </Card>
                                            ))}
                                        </VStack>

                                        {/* Voucher Section */}
                                        <Card
                                            style={{
                                                padding: 12,
                                                borderRadius: 12,
                                                backgroundColor: selectedVoucher
                                                    ? "#F0F9FF"
                                                    : "#F9FAFB",
                                                borderWidth: 1,
                                                borderColor: selectedVoucher
                                                    ? "#0EA5E9"
                                                    : "#E5E7EB",
                                                marginBottom: 16,
                                            }}
                                        >
                                            <HStack
                                                style={{
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <HStack
                                                    space="sm"
                                                    style={{
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Icon
                                                        as={TagIcon}
                                                        size="sm"
                                                        style={{
                                                            color: selectedVoucher
                                                                ? "#0EA5E9"
                                                                : "#6B7280",
                                                        }}
                                                    />

                                                    <VStack>
                                                        <Text
                                                            style={{
                                                                fontWeight:
                                                                    "medium",
                                                                color: selectedVoucher
                                                                    ? "#0EA5E9"
                                                                    : "#111827",
                                                            }}
                                                        >
                                                            {selectedVoucher
                                                                ? selectedVoucher.label
                                                                : "Add a Voucher"}
                                                        </Text>
                                                        {selectedVoucher && (
                                                            <Text
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#0EA5E9",
                                                                }}
                                                            >
                                                                {(
                                                                    selectedVoucher.discount *
                                                                    100
                                                                ).toFixed(0)}
                                                                % off
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                </HStack>

                                                <Button
                                                    onPress={() =>
                                                        setVoucherModalVisible(
                                                            true
                                                        )
                                                    }
                                                    variant={
                                                        selectedVoucher
                                                            ? "solid"
                                                            : "outline"
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            selectedVoucher
                                                                ? "#0EA5E9"
                                                                : "transparent",
                                                        borderColor: "#0EA5E9",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: selectedVoucher
                                                                ? "white"
                                                                : "#0EA5E9",
                                                        }}
                                                    >
                                                        {selectedVoucher
                                                            ? "Change"
                                                            : "Browse"}
                                                    </Text>
                                                </Button>
                                            </HStack>
                                        </Card>

                                        {/* Order Summary */}
                                        <Card
                                            style={{
                                                padding: 16,
                                                borderRadius: 12,
                                                backgroundColor: "#F9FAFB",
                                                marginBottom: 16,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontWeight: "bold",
                                                    marginBottom: 12,
                                                    color: "#111827",
                                                }}
                                            >
                                                Order Summary
                                            </Text>

                                            <VStack space="sm">
                                                <HStack
                                                    style={{
                                                        justifyContent:
                                                            "space-between",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: "#6B7280",
                                                        }}
                                                    >
                                                        Subtotal:
                                                    </Text>
                                                    <Text>
                                                        {
                                                            calculateTotal()
                                                                .subtotal
                                                        }{" "}
                                                        pts
                                                    </Text>
                                                </HStack>

                                                <HStack
                                                    style={{
                                                        justifyContent:
                                                            "space-between",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: "#6B7280",
                                                        }}
                                                    >
                                                        Discount:
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            color: "#DC2626",
                                                        }}
                                                    >
                                                        -
                                                        {
                                                            calculateTotal()
                                                                .discount
                                                        }{" "}
                                                        pts
                                                    </Text>
                                                </HStack>

                                                <Box
                                                    style={{
                                                        height: 1,
                                                        backgroundColor:
                                                            "#E5E7EB",
                                                        marginVertical: 8,
                                                    }}
                                                />

                                                <HStack
                                                    style={{
                                                        justifyContent:
                                                            "space-between",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontWeight: "bold",
                                                            color: "#111827",
                                                        }}
                                                    >
                                                        Total:
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontWeight: "bold",
                                                            color: "#059669",
                                                            fontSize: 16,
                                                        }}
                                                    >
                                                        {calculateTotal().total}{" "}
                                                        pts
                                                    </Text>
                                                </HStack>
                                            </VStack>

                                            {/* Available points indicator */}
                                            <HStack
                                                space="xs"
                                                style={{
                                                    alignItems: "center",
                                                    marginTop: 12,
                                                    padding: 8,
                                                    backgroundColor:
                                                        calculateTotal().total >
                                                        (userData?.points || 0)
                                                            ? "#FEF2F2"
                                                            : "#F0FDF4",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <Icon
                                                    as={
                                                        calculateTotal().total >
                                                        (userData?.points || 0)
                                                            ? AlertCircle
                                                            : CheckCircle2
                                                    }
                                                    size="sm"
                                                    style={{
                                                        color:
                                                            calculateTotal()
                                                                .total >
                                                            (userData?.points ||
                                                                0)
                                                                ? "#DC2626"
                                                                : "#10B981",
                                                    }}
                                                />
                                                <Text
                                                    style={{
                                                        color:
                                                            calculateTotal()
                                                                .total >
                                                            (userData?.points ||
                                                                0)
                                                                ? "#DC2626"
                                                                : "#10B981",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {calculateTotal().total >
                                                    (userData?.points || 0)
                                                        ? `Insufficient points (${
                                                              userData?.points ||
                                                              0
                                                          } available)`
                                                        : `You have enough points (${
                                                              userData?.points ||
                                                              0
                                                          } available)`}
                                                </Text>
                                            </HStack>
                                        </Card>
                                    </>
                                )}
                            </ModalBody>

                            {cartItems.length > 0 && (
                                <ModalFooter style={{ paddingRight: 10, marginLeft: 10 }}>
                                    <HStack
                                        space="md"
                                        style={{ width: "100%" }}
                                    >
                                        <Button
                                            variant="outline"
                                            style={{
                                                flex: 1,
                                                borderColor: "#6B7280",
                                            }}
                                            onPress={
                                                () => {
                                                    setCheckoutModalVisible(false)
                                                    setCartModalVisible(true)
                                                }
                                            }
                                        >
                                            <Text style={{ color: "#6B7280" }}>
                                                Go back to cart
                                            </Text>
                                        </Button>

                                        <Button
                                            style={{
                                                flex: 1,
                                                backgroundColor:
                                                    calculateTotal().total >
                                                    (userData?.points || 0)
                                                        ? "#9CA3AF"
                                                        : "#10B981",
                                            }}
                                            onPress={() =>
                                                setConfirmCheckoutVisible(true)
                                            }
                                            disabled={
                                                calculateTotal().total >
                                                (userData?.points || 0)
                                            }
                                        >
                                            <Text
                                                style={{
                                                    color: "white",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Place order
                                            </Text>
                                        </Button>
                                    </HStack>
                                </ModalFooter>
                            )}
                        </ModalContent>
                    </Modal>

                    {/* Voucher Modal */}
                    <Modal
                        isOpen={voucherModalVisible}
                        onClose={() => setVoucherModalVisible(false)}
                        size={isMobileScreen ? "lg" : "md"}
                    >
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalBody>
                                <VStack space="md">
                                    {vouchers.length > 0 ? (
                                        vouchers.map((voucher) => {
                                            const isSelected =
                                                selectedVoucher?.id === voucher.id;
                                            const isEligible =
                                                !voucher.minSpend ||
                                                calculateTotal().subtotal >=
                                                    voucher.minSpend;
    
                                            return (
                                                <Card
                                                    key={voucher.id}
                                                    style={{
                                                        padding: 12,
                                                        borderRadius: 12,
                                                        backgroundColor: isSelected
                                                            ? "#F0F9FF"
                                                            : "white",
                                                        borderWidth: 1,
                                                        borderColor: isSelected
                                                            ? "#0EA5E9"
                                                            : "#E5E7EB",
                                                        opacity: isEligible
                                                            ? 1
                                                            : 0.6,
                                                    }}
                                                >
                                                    <HStack
                                                        space="md"
                                                        style={{
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <LinearGradient
                                                            colors={
                                                                isSelected
                                                                    ? [
                                                                          "#0EA5E9",
                                                                          "#38BDF8",
                                                                      ]
                                                                    : [
                                                                          "#64748B",
                                                                          "#94A3B8",
                                                                      ]
                                                            }
                                                            style={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: 12,
                                                                justifyContent:
                                                                    "center",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    color: "white",
                                                                    fontWeight:
                                                                        "bold",
                                                                    fontSize: 16,
                                                                }}
                                                            >
                                                                {(
                                                                    voucher.discount *
                                                                    100
                                                                ).toFixed(0)}
                                                                %
                                                            </Text>
                                                        </LinearGradient>
    
                                                        <VStack style={{ flex: 1 }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight:
                                                                        "bold",
                                                                    color: "#111827",
                                                                }}
                                                            >
                                                                {voucher.label}
                                                            </Text>
    
                                                            <HStack
                                                                space="xs"
                                                                style={{
                                                                    alignItems:
                                                                        "center",
                                                                    marginTop: 2,
                                                                }}
                                                            >
                                                                {voucher.minSpend && (
                                                                    <Text
                                                                        style={{
                                                                            color: "#6B7280",
                                                                            fontSize: 13,
                                                                        }}
                                                                    >
                                                                        Min.{" "}
                                                                        {
                                                                            voucher.minSpend
                                                                        }{" "}
                                                                        pts
                                                                    </Text>
                                                                )}
    
                                                                {voucher.expiresAt && (
                                                                    <>
                                                                        {voucher.minSpend && (
                                                                            <Text
                                                                                style={{
                                                                                    color: "#CBD5E1",
                                                                                }}
                                                                            >
                                                                                •
                                                                            </Text>
                                                                        )}
                                                                        <Text
                                                                            style={{
                                                                                color: "#6B7280",
                                                                                fontSize: 13,
                                                                            }}
                                                                        >
                                                                            Expires{" "}
                                                                            {
                                                                                voucher.expiresAt
                                                                            }
                                                                        </Text>
                                                                    </>
                                                                )}
                                                            </HStack>
    
                                                            {!isEligible && (
                                                                <Text
                                                                    style={{
                                                                        color: "#DC2626",
                                                                        fontSize: 12,
                                                                        marginTop: 2,
                                                                    }}
                                                                >
                                                                    Need{" "}
                                                                    {
                                                                        voucher.minSpend
                                                                    }{" "}
                                                                    pts minimum to
                                                                    use this voucher
                                                                </Text>
                                                            )}
                                                        </VStack>
    
                                                        <Button
                                                            onPress={() => {
                                                                if (isEligible) {
                                                                    setSelectedVoucher(
                                                                        isSelected
                                                                            ? null
                                                                            : voucher
                                                                    );
                                                                    setVoucherModalVisible(
                                                                        false
                                                                    );
                                                                }
                                                            }}
                                                            variant={
                                                                isSelected
                                                                    ? "solid"
                                                                    : "outline"
                                                            }
                                                            style={{
                                                                backgroundColor:
                                                                    isSelected
                                                                        ? "#0EA5E9"
                                                                        : "transparent",
                                                                borderColor:
                                                                    "#0EA5E9",
                                                            }}
                                                            disabled={!isEligible}
                                                        >
                                                            <Text
                                                                style={{
                                                                    color: isSelected
                                                                        ? "white"
                                                                        : "#0EA5E9",
                                                                }}
                                                            >
                                                                {isSelected
                                                                    ? "Applied"
                                                                    : "Apply"}
                                                            </Text>
                                                        </Button>
                                                    </HStack>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <VStack
                                            space="md"
                                            style={{
                                                alignItems: "center",
                                                paddingTop: 24,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: "#6B7280",
                                                    textAlign: "center",
                                                }}
                                            >
                                                You have no vouchers available
                                            </Text>
                                            <Button
                                                onPress={() =>
                                                    setVoucherModalVisible(false)
                                                }
                                                style={{ marginTop: 8, backgroundColor: "#10B981" }}
                                            >
                                                <Text style={{ color: "white" }}>Go back</Text>
                                            </Button>
                                        </VStack>
                                    )}
                                </VStack>
                                <ModalFooter style={{ marginTop: 20 }}>
                                    <HStack
                                        space="md"
                                        style={{ width: "100%" }}
                                    >
                                        <Button
                                            variant="outline"
                                            style={{
                                                flex: 1,
                                                borderColor: "#6B7280",
                                            }}
                                            onPress={() => setVoucherModalVisible(false)}
                                        >
                                            <Text style={{ color: "#6B7280" }}>
                                                Close
                                            </Text>
                                        </Button>
                                    </HStack>
                                </ModalFooter>
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Checkout Confirmation Modal */}
                    <Modal
                        isOpen={confirmCheckoutVisible}
                        onClose={() => setConfirmCheckoutVisible(false)}
                        size="sm"
                    >
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading size="md">Confirm Redemption</Heading>
                                <ModalCloseButton>
                                    <Icon
                                        as={X}
                                        size="sm"
                                        style={{ color: "#6B7280" }}
                                    />
                                </ModalCloseButton>
                            </ModalHeader>

                            <ModalBody>
                                <VStack
                                    space="md"
                                    style={{
                                        alignItems: "center",
                                        padding: 12,
                                    }}
                                >
                                    <Icon
                                        as={AlertCircle}
                                        size="xl"
                                        style={{ color: "#FBBF24" }}
                                    />

                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: "#111827",
                                        }}
                                    >
                                        You are about to redeem equipment for{" "}
                                        <Text
                                            style={{
                                                fontWeight: "bold",
                                                color: "#059669",
                                            }}
                                        >
                                            {calculateTotal().total} points
                                        </Text>
                                        . This action cannot be undone.
                                    </Text>

                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: "#6B7280",
                                            fontSize: 13,
                                        }}
                                    >
                                        After redemption, you will have{" "}
                                        <Text style={{ fontWeight: "bold" }}>
                                            {(userData?.points || 0) -
                                                calculateTotal().total}{" "}
                                            points
                                        </Text>{" "}
                                        remaining.
                                    </Text>

                                    <HStack
                                        space="md"
                                        style={{ width: "100%", marginTop: 16 }}
                                    >
                                        <Button
                                            variant="outline"
                                            style={{
                                                flex: 1,
                                                borderColor: "#6B7280",
                                            }}
                                            onPress={() =>
                                                setConfirmCheckoutVisible(false)
                                            }
                                        >
                                            <Text style={{ color: "#6B7280" }}>
                                                Cancel
                                            </Text>
                                        </Button>

                                        <Button
                                            style={{
                                                flex: 1,
                                                backgroundColor: "#10B981",
                                            }}
                                            onPress={handleCheckout}
                                        >
                                            <Text
                                                style={{
                                                    color: "white",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Confirm
                                            </Text>
                                        </Button>
                                    </HStack>
                                </VStack>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </SafeAreaView>
            </LinearGradient>
        </ProtectedRoute>
    );
};