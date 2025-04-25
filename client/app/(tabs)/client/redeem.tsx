// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useWindowDimensions, ScrollView, Pressable } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/ui/icon";
import { Box } from "@/components/ui/box";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox, CheckboxIndicator, CheckboxIcon } from "@/components/ui/checkbox";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { ShoppingCart, Check, Minus, Plus, Disc, Camera, AlertCircle, CheckCircle2, Trash2 } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";
import server from "../../../networking";

interface Product {
	id: string;
	itemName: string;
	itemDescription: string;
	pointsToRedeem: number;
}

export default function RedeemScreen() {
	const { width } = useWindowDimensions();
	const isMobileScreen = width < 680;
	const [products, setProducts] = useState([]);
	const [cartItems, setCartItems] = useState([]);
	const [productsLoading, setProductsLoading] = useState(false);
	const [cartModalVisible, setCartModalVisible] = useState(false);
	const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
	const [confirmCheckoutModalVisible, setConfirmCheckoutModalVisible] = useState(false);
	const [checkingOut, setCheckingOut] = useState(false);
	const toast = useToast();

    const { userData } = useAuth();

	const mapBarcodeToProduct = (b: any): Product => ({
		id: b.id,
		itemName: b.itemName,
		itemDescription: b.itemDescription,
		pointsToRedeem: b.pointsToRedeem
	});

	const fetchBarcodes = async () => {
		try {
			setProductsLoading(true);
			const barcodes = await server.get("/api/barcodes");
			if (barcodes.status === 200) {
				const rawBarcodes = barcodes.data.result;
				const products = rawBarcodes.map(mapBarcodeToProduct);
				setProducts(products);
			}
		} catch (error) {
			if (error.response && error.response.data && error.response.data.error && typeof error.response.data.error === "string") {
				if (error.response.data.error.startsWith("UERROR")) {
					showToast("Uh-oh!", error.response.data.error.substring("UERROR:".length));
				} else {
					showToast("Uh-oh!", error.response.data.error.substring("ERROR:".length));
				}
			}
		} finally {
			setProductsLoading(false);
		}
	};

	const handleAddToCart = (product: any) => {
		setCartItems(prev => {
			const existing = prev.find(item => item.product.id === product.id);
			if (existing) return prev;
			return [...prev, { product, quantity: 1, selected: true }];
		});
	};

	const removeFromCart = (productId: string) => {
		setCartItems(prev => prev.filter(item => item.product.id !== productId));
	};

	const updateQuantity = (productId: string, delta: number) => {
		setCartItems(prev =>
			prev.map(item => {
					if (item.product.id === productId) {
						const newQuantity = item.quantity + delta;
						if (newQuantity < 1) return null;

						return { ...item, quantity: newQuantity };
					}
					return item;
				})
				.filter(item => item !== null)
		);
	};

	const selectedItems = useMemo(() => cartItems.filter(item => item.selected), [cartItems]);

	const toggleSelection = (productId?: string) => {
		if (!productId) {
			const allSelected = cartItems.every(item => item.selected);
			setCartItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
		} else {
			setCartItems(prev => prev.map(item => (item.product.id === productId ? { ...item, selected: !item.selected } : item)));
		}
	};

	const calculateTotal = () => {
		const total = cartItems.filter(item => item.selected).reduce((sum, item) => sum + item.product.pointsToRedeem * item.quantity, 0);

		return total;
	};

	const getTotalItemsCount = () => {
		return cartItems.reduce((sum, item) => sum + item.quantity, 0);
	};

	const handleCheckout = async () => {
		setCheckingOut(true);

		try {
			await server.post("/api/redeem", {
				items: selectedItems.map(item => ({
					id: item.product.id,
					quantity: item.quantity
				}))
			});

			setCartItems([]);
			setCartModalVisible(false);
			setConfirmCheckoutModalVisible(false);
			setCheckoutModalVisible(false);
			showToast("Success", "Redemption successful!");
		} catch (error) {
			if (error.response && error.response.data && error.response.data.error && typeof error.response.data.error === "string") {
				if (error.response.data.error.startsWith("UERROR")) {
					showToast("Uh-oh!", error.response.data.error.substring("UERROR:".length));
				} else {
					showToast("Uh-oh!", error.response.data.error.substring("ERROR:".length));
				}
			}
		} finally {
			setCheckingOut(false);
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
			)
		});
	};

	useEffect(() => {
        if (userData) {
            fetchBarcodes();
        }
	}, [userData]);

	if (!productsLoading) return (
        <ProtectedRoute>
            {userData => (
                <LinearGradient colors={["#F0FDF4", "#ECFEFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        {/* Header */}
                        <HStack
                            style={{
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: "#E2E8F0"
                            }}
                        >
                            <VStack>
                                <Heading size="lg" style={{ color: "#166534" }}>
                                    Equipment Redemption
                                </Heading>
                                <HStack space="xs" style={{ alignItems: "center", marginTop: 4 }}>
                                    <Icon as={Disc} size="sm" style={{ color: "#059669" }} />
                                    <Text
                                        style={{
                                            color: "#059669",
                                            fontWeight: "medium"
                                        }}
                                    >
                                        Available Points: {userData?.points || 0}
                                    </Text>
                                </HStack>
                            </VStack>

                            <Button
                                onPress={() => setCartModalVisible(true)}
                                style={{
                                    aspectRatio: 1,
                                    padding: 12,
                                    borderRadius: 999,
                                    backgroundColor: cartItems.length > 0 ? "#ECFDF5" : "transparent",
                                    borderColor: "#10B981",
                                    borderWidth: 1,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative"
                                }}
                            >
                                <Icon as={ShoppingCart} size="xl" style={{ color: "#10B981" }} />

                                {cartItems.length > 0 && (
                                    <Box
                                        style={{
                                            position: "absolute",
                                            top: -5,
                                            right: -5,
                                            backgroundColor: "#10B981",
                                            borderRadius: 999,
                                            minWidth: 20,
                                            height: 20,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            paddingHorizontal: 4
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: "white",
                                                fontSize: 12,
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {getTotalItemsCount()}
                                        </Text>
                                    </Box>
                                )}
                            </Button>
                        </HStack>

                        {/* Main Content */}
                        <ScrollView contentContainerStyle={{ padding: 16 }}>
                            {productsLoading ? (
                                <Box style={{ padding: 40, alignItems: "center" }}>
                                    <Spinner size="large" color="#10B981" />
                                    <Text style={{ marginTop: 16, color: "#6B7280" }}>Loading available equipment...</Text>
                                </Box>
                            ) : products.length > 0 ? (
                                <VStack space="lg">
                                    {products.map(product => (
                                        <Card
                                            key={product.id}
                                            style={{
                                                padding: 16,
                                                borderRadius: 16,
                                                backgroundColor: "white",
                                                shadowColor: "#000",
                                                shadowOffset: {
                                                    width: 0,
                                                    height: 2
                                                },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 4,
                                                elevation: 2,
                                                borderWidth: 1,
                                                borderColor: cartItems.some(i => i.product.id === product.id) ? "#10B981" : "white"
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
                                                        overflow: "hidden"
                                                    }}
                                                >
                                                    {product.image ? (
                                                        <Avatar
                                                            size="xl"
                                                            style={{
                                                                width: 100,
                                                                height: 100
                                                            }}
                                                        >
                                                            <AvatarImage
                                                                style={{
                                                                    width: 100,
                                                                    height: 100
                                                                }}
                                                                source={{
                                                                    uri: `/api/placeholder/100/100`
                                                                }}
                                                                alt={`${product.itemName} image`}
                                                            />
                                                        </Avatar>
                                                    ) : (
                                                        <Icon
                                                            as={Camera}
                                                            size="xl"
                                                            style={{
                                                                color: "#9CA3AF"
                                                            }}
                                                        />
                                                    )}
                                                </Box>

                                                {/* Product Info */}
                                                <VStack
                                                    space="xs"
                                                    style={{
                                                        flex: 1,
                                                        justifyContent: "space-between"
                                                    }}
                                                >
                                                    <VStack>
                                                        <HStack
                                                            space="xs"
                                                            style={{
                                                                alignItems: "center"
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 18,
                                                                    fontWeight: "bold",
                                                                    color: "#111827"
                                                                }}
                                                            >
                                                                {product.itemName}
                                                            </Text>
                                                        </HStack>

                                                        <Text
                                                            style={{
                                                                color: "#4B5563",
                                                                marginTop: 4
                                                            }}
                                                        >
                                                            {product.itemDescription}
                                                        </Text>
                                                    </VStack>

                                                    <HStack
                                                        style={{
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            marginTop: 8
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 16,
                                                                fontWeight: "bold",
                                                                color: "#059669"
                                                            }}
                                                        >
                                                            {product.pointsToRedeem} points
                                                        </Text>

                                                        {cartItems.some(i => i.product.id === product.id) ? (
                                                            <HStack
                                                                space="md"
                                                                style={{
                                                                    alignItems: "center",
                                                                    backgroundColor: "#F3F4F6",
                                                                    borderRadius: 8,
                                                                    padding: 4
                                                                }}
                                                            >
                                                                <Pressable
                                                                    onPress={() => updateQuantity(product.id, -1)}
                                                                    style={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: 16,
                                                                        padding: 0,
                                                                        justifyContent: "center",
                                                                        alignItems: "center"
                                                                    }}
                                                                >
                                                                    <Icon
                                                                        as={Minus}
                                                                        size="sm"
                                                                        style={{
                                                                            color: "#6B7280"
                                                                        }}
                                                                    />
                                                                </Pressable>

                                                                <Text
                                                                    style={{
                                                                        fontWeight: "medium",
                                                                        width: 24,
                                                                        textAlign: "center"
                                                                    }}
                                                                >
                                                                    {cartItems.find(i => i.product.id === product.id)?.quantity}
                                                                </Text>

                                                                <Pressable
                                                                    onPress={() => updateQuantity(product.id, 1)}
                                                                    style={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: 16,
                                                                        padding: 0,
                                                                        justifyContent: "center",
                                                                        alignItems: "center"
                                                                    }}
                                                                >
                                                                    <Icon
                                                                        as={Plus}
                                                                        size="sm"
                                                                        style={{
                                                                            color: "#6B7280"
                                                                        }}
                                                                    />
                                                                </Pressable>
                                                            </HStack>
                                                        ) : (
                                                            <Button
                                                                onPress={() => handleAddToCart(product)}
                                                                style={{
                                                                    backgroundColor: "#10B981",
                                                                    borderRadius: 8,
                                                                    paddingHorizontal: 16
                                                                }}
                                                            >
                                                                <HStack
                                                                    space="xs"
                                                                    style={{
                                                                        alignItems: "center"
                                                                    }}
                                                                >
                                                                    <Icon
                                                                        as={ShoppingCart}
                                                                        size="sm"
                                                                        style={{
                                                                            color: "white"
                                                                        }}
                                                                    />
                                                                    <Text
                                                                        style={{
                                                                            color: "white",
                                                                            fontWeight: "medium",
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
                            ) : (
                                <VStack
                                    space="md"
                                    style={{
                                        alignItems: "center",
                                        padding: 24
                                    }}
                                >
                                    <Icon as={Camera} size="xl" style={{ color: "#D1D5DB" }} />
                                    <Text
                                        style={{
                                            color: "#6B7280",
                                            textAlign: "center"
                                        }}
                                    >
                                        No equipment available
                                    </Text>
                                </VStack>
                            )}
                        </ScrollView>

                        {/* Cart Modal */}
                        <Modal isOpen={cartModalVisible} onClose={() => setCartModalVisible(false)} size={isMobileScreen ? "full" : "md"} style={{ paddingHorizontal: 15, paddingVertical: 100 }}>
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
                                                padding: 24
                                            }}
                                        >
                                            <Icon as={ShoppingCart} size="xl" style={{ color: "#D1D5DB" }} />
                                            <Text
                                                style={{
                                                    color: "#6B7280",
                                                    textAlign: "center"
                                                }}
                                            >
                                                Your cart is empty. Add items to get started.
                                            </Text>
                                            <Button onPress={() => setCartModalVisible(false)} style={{ marginTop: 8, backgroundColor: "#10B981" }}>
                                                <Text style={{ color: "white" }}>Browse Equipment</Text>
                                            </Button>
                                        </VStack>
                                    ) : (
                                        <>
                                            <VStack space="sm" style={{ marginBottom: 16 }}>
                                                {cartItems.map(item => (
                                                    <HStack
                                                        key={item.product.id}
                                                        style={{
                                                            alignItems: "center",
                                                            justifyContent: "flex-start",
                                                            marginBottom: 12
                                                        }}
                                                    >
                                                        <Card
                                                            style={{
                                                                flex: 1,
                                                                padding: 12,
                                                                borderRadius: 12,
                                                                backgroundColor: item.selected ? "#ECFDF5" : "white",
                                                                borderWidth: 1,
                                                                borderColor: item.selected ? "#10B981" : "#E5E7EB"
                                                            }}
                                                        >
                                                            <HStack space="md" style={{ alignItems: "center" }}>
                                                                {/* Checkbox */}
                                                                <Checkbox value={item.product.id} isChecked={item.selected} onChange={() => toggleSelection(item.product.id)}>
                                                                    <CheckboxIndicator
                                                                        style={{
                                                                            marginRight: 8,
                                                                            borderColor: item.selected ? "#10B981" : "gray",
                                                                            backgroundColor: item.selected ? "#10B981" : "white"
                                                                        }}
                                                                    >
                                                                        <CheckboxIcon as={Check} />
                                                                    </CheckboxIndicator>
                                                                </Checkbox>

                                                                {/* Product Icon */}
                                                                <Box
                                                                    style={{
                                                                        width: 50,
                                                                        height: 50,
                                                                        borderRadius: 6,
                                                                        backgroundColor: "#F9FAFB",
                                                                        justifyContent: "center",
                                                                        alignItems: "center"
                                                                    }}
                                                                >
                                                                    <Icon as={Camera} size="md" style={{ color: "#9CA3AF" }} />
                                                                </Box>

                                                                {/* Product Info */}
                                                                <VStack style={{ flex: 1 }}>
                                                                    <Text style={{ fontWeight: "500", color: "#111827" }}>{item.product.itemName}</Text>

                                                                    <HStack
                                                                        style={{
                                                                            justifyContent: "space-between",
                                                                            marginTop: 4,
                                                                            alignItems: "flex-end"
                                                                        }}
                                                                    >
                                                                        {/* Quantity controls */}
                                                                        <HStack space="sm" style={{ alignItems: "center" }}>
                                                                            <Pressable onPress={() => updateQuantity(item.product.id, -1)}>
                                                                                <Icon as={Minus} size="xs" style={{ color: "#6B7280" }} />
                                                                            </Pressable>

                                                                            <Text
                                                                                style={{
                                                                                    width: 20,
                                                                                    textAlign: "center"
                                                                                }}
                                                                            >
                                                                                {item.quantity}
                                                                            </Text>

                                                                            <Pressable onPress={() => updateQuantity(item.product.id, 1)}>
                                                                                <Icon as={Plus} size="xs" style={{ color: "#6B7280" }} />
                                                                            </Pressable>
                                                                        </HStack>

                                                                        <Text
                                                                            style={{
                                                                                fontWeight: "500",
                                                                                color: "#059669",
                                                                                textAlign: "right",
                                                                                paddingRight: 4
                                                                            }}
                                                                        >
                                                                            {item.product.pointsToRedeem * item.quantity} pts
                                                                        </Text>
                                                                    </HStack>
                                                                </VStack>
                                                            </HStack>
                                                        </Card>

                                                        <Pressable
                                                            onPress={() => removeFromCart(item.product.id)}
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 16,
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                marginLeft: 8,
                                                                alignSelf: "center"
                                                            }}
                                                        >
                                                            <Icon as={Trash2} size="md" style={{ color: "#AF531F" }} />
                                                        </Pressable>
                                                    </HStack>
                                                ))}
                                            </VStack>

                                            {/* Order Summary */}
                                            <Card
                                                style={{
                                                    padding: 16,
                                                    borderRadius: 12,
                                                    backgroundColor: "#F9FAFB",
                                                    marginBottom: 16
                                                }}
                                            >
                                                <VStack space="sm">
                                                    <HStack
                                                        style={{
                                                            justifyContent: "space-between"
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontWeight: "bold",
                                                                color: "#111827"
                                                            }}
                                                        >
                                                            Total:
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontWeight: "bold",
                                                                color: "black",
                                                                fontSize: 16
                                                            }}
                                                        >
                                                            {calculateTotal()} pts
                                                        </Text>
                                                    </HStack>
                                                </VStack>
                                            </Card>
                                        </>
                                    )}
                                </ModalBody>

                                {cartItems.length > 0 && (
                                    <ModalFooter style={{ paddingRight: 10, marginLeft: 10 }}>
                                        <HStack space="md" style={{ width: "100%" }}>
                                            <Button
                                                variant="outline"
                                                style={{
                                                    flex: 1,
                                                    borderColor: "#6B7280"
                                                }}
                                                onPress={() => setCartModalVisible(false)}
                                            >
                                                <Text style={{ color: "#6B7280" }}>Continue Shopping</Text>
                                            </Button>

                                            <Button
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: cartItems.filter(i => i.selected).length === 0 ? "#9CA3AF" : "#10B981"
                                                }}
                                                onPress={() => {
                                                    setCartModalVisible(false);
                                                    setCheckoutModalVisible(true);
                                                }}
                                                disabled={cartItems.filter(i => i.selected).length === 0}
                                            >
                                                <Text
                                                    style={{
                                                        color: "white",
                                                        fontWeight: "bold"
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
                        <Modal isOpen={checkoutModalVisible} onClose={() => setCheckoutModalVisible(false)} size={isMobileScreen ? "full" : "md"} style={{ paddingHorizontal: 15, paddingVertical: 100 }}>
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
                                                padding: 24
                                            }}
                                        >
                                            <Icon as={ShoppingCart} size="xl" style={{ color: "#D1D5DB" }} />
                                            <Text
                                                style={{
                                                    color: "#6B7280",
                                                    textAlign: "center"
                                                }}
                                            >
                                                You have nothing to checkout.
                                            </Text>
                                            <Button
                                                onPress={() => {
                                                    setCheckoutModalVisible(false);
                                                    setCartModalVisible(true);
                                                }}
                                                style={{ marginTop: 8, backgroundColor: "#10B981" }}
                                            >
                                                <Text style={{ color: "white" }}>Go back to cart</Text>
                                            </Button>
                                        </VStack>
                                    ) : (
                                        <>
                                            <VStack space="md" style={{ marginBottom: 16 }}>
                                                {selectedItems.map(item => (
                                                    <Card
                                                        key={item.product.id}
                                                        style={{
                                                            padding: 12,
                                                            borderRadius: 12,
                                                            backgroundColor: "#ECFDF5",
                                                            borderColor: "#9CA3AF",
                                                            borderWidth: 1
                                                        }}
                                                    >
                                                        <HStack
                                                            space="md"
                                                            style={{
                                                                alignItems: "center"
                                                            }}
                                                        >
                                                            <Box
                                                                style={{
                                                                    width: 50,
                                                                    height: 50,
                                                                    borderRadius: 6,
                                                                    backgroundColor: "#F9FAFB",
                                                                    justifyContent: "center",
                                                                    alignItems: "center"
                                                                }}
                                                            >
                                                                <Icon
                                                                    as={Camera}
                                                                    size="md"
                                                                    style={{
                                                                        color: "#9CA3AF"
                                                                    }}
                                                                />
                                                            </Box>

                                                            <VStack style={{ flex: 1 }}>
                                                                <Text
                                                                    style={{
                                                                        fontWeight: "medium",
                                                                        color: "#111827"
                                                                    }}
                                                                >
                                                                    {item.product.itemName}
                                                                </Text>
                                                            </VStack>

                                                            <Text
                                                                style={{
                                                                    marginLeft: "auto",
                                                                    marginRight: 3,
                                                                    color: "#4B5563",
                                                                    fontWeight: "bold",
                                                                    fontSize: 14
                                                                }}
                                                            >
                                                                x{item.quantity}
                                                            </Text>
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
                                                    marginBottom: 16
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontWeight: "bold",
                                                        marginBottom: 12,
                                                        color: "#111827"
                                                    }}
                                                >
                                                    Order Summary
                                                </Text>

                                                <VStack space="sm">
                                                    <Box
                                                        style={{
                                                            height: 1,
                                                            backgroundColor: "#E5E7EB",
                                                            marginVertical: 8
                                                        }}
                                                    />

                                                    <HStack
                                                        style={{
                                                            justifyContent: "space-between"
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontWeight: "bold",
                                                                color: "#111827"
                                                            }}
                                                        >
                                                            Total:
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontWeight: "bold",
                                                                color: "black",
                                                                fontSize: 16
                                                            }}
                                                        >
                                                            {calculateTotal()} pts
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
                                                        backgroundColor: calculateTotal() > (userData?.points || 0) ? "#FEF2F2" : "#F0FDF4",
                                                        borderRadius: 8
                                                    }}
                                                >
                                                    <Icon
                                                        as={calculateTotal() > (userData?.points || 0) ? AlertCircle : CheckCircle2}
                                                        size="sm"
                                                        style={{
                                                            color: calculateTotal().total > (userData?.points || 0) ? "#DC2626" : "#10B981"
                                                        }}
                                                    />
                                                    <Text
                                                        style={{
                                                            color: calculateTotal() > (userData?.points || 0) ? "#DC2626" : "#10B981",
                                                            fontSize: 13
                                                        }}
                                                    >
                                                        {calculateTotal() > (userData?.points || 0) ? `Insufficient points (${userData?.points || 0} available)` : `You have enough points (${userData?.points || 0} available)`}
                                                    </Text>
                                                </HStack>
                                            </Card>
                                        </>
                                    )}
                                </ModalBody>

                                {selectedItems.length > 0 && (
                                    <ModalFooter style={{ paddingRight: 10, marginLeft: 10 }}>
                                        <HStack space="md" style={{ width: "100%" }}>
                                            <Button
                                                variant="outline"
                                                style={{
                                                    flex: 1,
                                                    borderColor: "#6B7280"
                                                }}
                                                onPress={() => {
                                                    setCheckoutModalVisible(false);
                                                    setCartModalVisible(true);
                                                }}
                                            >
                                                <Text style={{ color: "#6B7280" }}>Go back to cart</Text>
                                            </Button>

                                            <Button
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: calculateTotal() > (userData?.points || 0) ? "#9CA3AF" : "#10B981"
                                                }}
                                                onPress={() => {
                                                    setCheckoutModalVisible(false);
                                                    setConfirmCheckoutModalVisible(true);
                                                }}
                                                disabled={calculateTotal() > (userData?.points || 0)}
                                            >
                                                <Text
                                                    style={{
                                                        color: "white",
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    Proceed
                                                </Text>
                                            </Button>
                                        </HStack>
                                    </ModalFooter>
                                )}
                            </ModalContent>
                        </Modal>

                        {/* Checkout Confirmation Modal */}
                        <Modal isOpen={confirmCheckoutModalVisible} onClose={() => setConfirmCheckoutModalVisible(false)} size="sm">
                            <ModalBackdrop />
                            <ModalContent>
                                <ModalHeader style={{ display: "flex", justifyContent: "center" }}>
                                    <Heading size="md">Confirm Redemption?</Heading>
                                </ModalHeader>

                                <ModalBody>
                                    <VStack
                                        space="md"
                                        style={{
                                            alignItems: "center",
                                            padding: 12
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: "center",
                                                color: "#111827"
                                            }}
                                        >
                                            You are about to spend{" "}
                                            <Text
                                                style={{
                                                    fontWeight: "bold",
                                                    color: "#059669"
                                                }}
                                            >
                                                {calculateTotal()} points.
                                            </Text>
                                        </Text>

                                        <Text
                                            style={{
                                                textAlign: "center",
                                                color: "#6B7280",
                                                fontSize: 13
                                            }}
                                        >
                                            After redemption, you will have <Text style={{ fontWeight: "bold" }}>{(userData?.points || 0) - calculateTotal()} points</Text> remaining.
                                        </Text>

                                        <HStack space="md" style={{ width: "100%", marginTop: 16 }}>
                                            <Button
                                                variant="outline"
                                                style={{
                                                    flex: 1,
                                                    borderColor: "#6B7280"
                                                }}
                                                onPress={() => {
                                                    setConfirmCheckoutModalVisible(false);
                                                    setCheckoutModalVisible(true);
                                                }}
                                            >
                                                <Text style={{ color: "#6B7280" }}>Cancel</Text>
                                            </Button>

                                            <Button
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: "#10B981"
                                                }}
                                                onPress={() => handleCheckout()}
                                            >
                                                {checkingOut ? (
                                                    <Spinner size="small" color={"white"} />
                                                ) : (
                                                    <Text
                                                        style={{
                                                            color: "white",
                                                            fontWeight: "bold"
                                                        }}
                                                    >
                                                        Place order
                                                    </Text>
                                                )}
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </ModalBody>
                            </ModalContent>
                        </Modal>
                    </SafeAreaView>
                </LinearGradient>
            )}
        </ProtectedRoute>
	);
}