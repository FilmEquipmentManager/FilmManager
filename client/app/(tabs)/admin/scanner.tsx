import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { ScrollView, useWindowDimensions } from "react-native";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Modal, ModalBackdrop, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Checkbox, CheckboxIndicator, CheckboxIcon } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem } from '@/components/ui/select';
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control"
import { Icon, CloseIcon, CheckIcon, ChevronDownIcon } from "@/components/ui/icon";
import Constants from "expo-constants";
import server from "../../../networking";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangleIcon, ArrowDownCircle, ArrowUpCircle, CheckCircleIcon, MinusCircleIcon, PencilIcon, ScanIcon, SparklesIcon, Trash2Icon, WarehouseIcon } from "lucide-react-native";
import { Box } from "@/components/ui/box";
import { useLocalSearchParams } from "expo-router";

interface ScannedItem {
    id: string;
    barcode: string;
    group: string;
    itemName: string;
    itemDescription: string;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
    totalCount: number;
    sessionCount: number;
    location: string;
    pointsToRedeem: number;
}

export default function ScannerScreen() {
    const [currentScan, setCurrentScan] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [scannedCode, setScannedCode] = useState("");
    const [editingItem, setEditingItem] = useState<ScannedItem | null>(null);
    const [editingBarcode, setEditingBarcode] = useState("");
    const [pendingItems, setPendingItems] = useState<ScannedItem[]>([]);
    const [pendingUnknownItems, setPendingUnknownItems] = useState<ScannedItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingItemName, setEditingItemName] = useState("");
    const [editingItemDescription, setEditingItemDescription] = useState("");
    const [editingItemCount, setEditingItemCount] = useState('');
    const [editingItemLocation, setEditingItemLocation] = useState("");
    const [editingItemPointsToRedeem, setEditingItemPointsToRedeem] = useState("");
    const [editingItemGroup, setEditingItemGroup] = useState("");
    const [originalItemName, setOriginalItemName] = useState('');
    const [originalItemDescription, setOriginalItemDescription] = useState('');
    const [originalItemCount, setOriginalItemCount] = useState('');
    const [originalItemLocation, setOriginalItemLocation] = useState('');
    const [originalItemPointsToRedeem, setOriginalItemPointsToRedeem] = useState('');
    const [originalItemGroup, setOriginalItemGroup] = useState('');
    const [isEditingUnknown, setIsEditingUnknown] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [showUnknownEditModal, setShowUnknownEditModal] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { width, height } = useWindowDimensions();
    const isShortScreen = height < 750;
    const isMobileScreen = width < 680;

    const groupLabels = { camera: "Camera", lighting: "Lighting", audio: "Audio", lenses: "Lenses", accessories: "Accessories", grip: "Grip Equipment", power: "Power Supply", cables: "Cables", misc: "Miscellaneous", others: "Others" };

    const inputRef = useRef<any>(null);
    const { mode } = useLocalSearchParams();
    const currentMode = typeof mode === "string" ? mode : "info";

    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const BASE_URL = Constants.expoConfig?.extra?.BASE_URL;

    // Toast helper
    const showToast = (title: string, description: string) => {
        const newId = Math.random();
        setToastId(newId);
        toast.show({
            id: newId.toString(),
            placement: "top",
            duration: 3000,
            render: ({ id }) => {
                const uniqueToastId = "toast-" + id;
                return (
                    <Toast nativeID={uniqueToastId} action="muted" variant="solid">
                        <ToastTitle>{title}</ToastTitle>
                        <ToastDescription>{description}</ToastDescription>
                    </Toast>
                );
            },
        });
    };

    // Set up socket connection to listen for barcode updates
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

        return () => {
            socket.disconnect();
        };
    }, []);

    // Auto-submit scan when the length of the scanned text meets a threshold
    useEffect(() => {
        const MIN_BARCODE_LENGTH = 6;
        if (currentScan.trim().length < MIN_BARCODE_LENGTH) return;

        const timeout = setTimeout(() => {
            handleScannedItems();
        }, 100);

        return () => clearTimeout(timeout);
    }, [currentScan]);

    const handleScannedItems = async () => {
        if (currentScan.trim()) {
            setIsLoading(true);
            const barcodeToScan = currentScan.trim();

            try {
                const response = await server.get("/api/barcodes");
                const existingBarcodes: ScannedItem[] = response.data.result;

                const matchedItem = existingBarcodes.find(item => item.barcode === barcodeToScan);
                const isKnown = !!matchedItem;

                const currentPendingList = isKnown ? pendingItems : pendingUnknownItems;
                const setPendingList = isKnown ? setPendingItems : setPendingUnknownItems;

                const existingPendingItem = currentPendingList.find(
                    item => item.barcode === barcodeToScan
                );

                let newPendingItems: ScannedItem[];

                if (existingPendingItem) {
                    newPendingItems = currentPendingList.map(item =>
                        item.barcode === barcodeToScan
                            ? { ...item, sessionCount: (item.sessionCount || 0) + 1 }
                            : item
                    );
                    setPendingList(newPendingItems);
                } else {
                    const newItem: ScannedItem = matchedItem
                        ? {
                            ...matchedItem,
                            totalCount: matchedItem.totalCount || 0,
                            sessionCount: 1,
                        }
                        : {
                            id: Date.now().toString(),
                            barcode: barcodeToScan,
                            group: "others",
                            itemName: "",
                            itemDescription: "",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            updatedBy: "",
                            totalCount: 0,
                            sessionCount: 1,
                            location: "",
                            pointsToRedeem: 0,
                        };

                    if (isKnown) {
                        newPendingItems = [...currentPendingList, newItem];
                        setPendingList(newPendingItems);
                    } else {
                        handleEditUnknownItem(newItem);
                    }
                }

                setCurrentScan("");
                setScannedCode(barcodeToScan);
                setIsFocused(false);
                setIsLoading(false);
            } catch (error) {
                console.error("Error checking barcode:", error);
                showToast("Scan failed", "Could not verify barcode with the server.");
                setIsLoading(false);
                setIsFocused(false);
            }
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    }

    const areAllGroupItemsSelected = (groupItems: ScannedItem[]) => {
        return groupItems.every(item => selectedIds.has(item.id));
    };

    const toggleSelectGroup = (group: string) => {
        const groupItems = groupedItems[group];
        const allSelected = areAllGroupItemsSelected(groupItems);

        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                groupItems.forEach(item => newSet.delete(item.id));
            } else {
                groupItems.forEach(item => newSet.add(item.id));
            }
            return newSet;
        });
    };

    const allPendingItems = [...pendingItems, ...pendingUnknownItems];

    const groupedItems: Record<string, ScannedItem[]> = allPendingItems.reduce((groups, item) => {
        const group = item.group?.toLowerCase() || "Unknown";
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
    }, {});

    const allSelected = selectedIds.size === allPendingItems.length;

    const selectAll = () => {
        setSelectedIds(new Set(allPendingItems.map(item => item.id)));
    };

    const unselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleClearResults = () => {
        setIsLoading(true);
        setCurrentScan("");
        setIsFocused(false);
        setScannedCode("");
        setPendingItems([]);
        setPendingUnknownItems([]);
        setSelectedIds(new Set());
        showToast("Cleared", "All scanned results have been removed.");
        setIsLoading(false);
    };

    const handleRemove = (id: string) => {
        if (pendingItems.some(item => item.id === id)) {
            setPendingItems(prev => prev.filter(item => item.id !== id));
        } else {
            setPendingUnknownItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleEdit = (item: ScannedItem) => {
        setEditingItem(item);
        setEditingBarcode(item.barcode ?? "");
        setEditingItemName(item.itemName ?? "");
        setEditingItemDescription(item.itemDescription ?? "");
        setEditingItemCount(item.totalCount?.toString() ?? "0");
        setEditingItemLocation(item.location ?? "");
        setEditingItemPointsToRedeem(item.pointsToRedeem?.toString() ?? "0");
        setEditingItemGroup(item.group ?? "");

        setOriginalItemName(item.itemName ?? "");
        setOriginalItemDescription(item.itemDescription ?? "");
        setOriginalItemCount(item.totalCount?.toString() ?? "0");
        setOriginalItemLocation(item.location ?? "");
        setOriginalItemPointsToRedeem(item.pointsToRedeem?.toString() ?? "0");
        setOriginalItemGroup(item.group ?? "");

        const isUnknown = pendingUnknownItems.some(i => i.id === item.id);
        setIsEditingUnknown(isUnknown);

        setShowEditModal(true);
    };

    const handleEditUnknownItem = (item: ScannedItem) => {
        setEditingItem(item);
        setEditingBarcode(item.barcode ?? "");
        setEditingItemName(item.itemName ?? "");
        setEditingItemDescription(item.itemDescription ?? "");
        setEditingItemCount(item.totalCount?.toString() ?? "0");
        setEditingItemLocation(item.location ?? "");
        setEditingItemPointsToRedeem(item.pointsToRedeem?.toString() ?? "0");
        setEditingItemGroup(item.group ?? "unknown");

        setShowUnknownEditModal(true);
    };

    const hasChanges =
        editingBarcode.trim() !== editingItem?.barcode.trim() ||
        editingItemName.trim() !== originalItemName.trim() ||
        editingItemDescription.trim() !== originalItemDescription.trim() ||
        editingItemCount.trim() !== originalItemCount.trim() ||
        editingItemLocation.trim() !== originalItemLocation.trim() ||
        editingItemPointsToRedeem.trim() !== originalItemPointsToRedeem.trim() ||
        editingItemGroup.trim() !== originalItemGroup.trim();

    const handleReceive = async () => {
        setIsLoading(true);
        const knownItemsToReceive = pendingItems.filter(item => selectedIds.has(item.id));
        const unknownItemsToReceive = pendingUnknownItems.filter(item => selectedIds.has(item.id));

        try {
            // Update known items (PUT)
            const updatePromises = knownItemsToReceive.map(item =>
                server.put(`/api/barcodes/${item.id}`, {
                    barcode: item.barcode,
                    group: item.group,
                    itemName: item.itemName,
                    itemDescription: item.itemDescription,
                    location: item.location,
                    pointsToRedeem: item.pointsToRedeem,
                    count: item.totalCount + item.sessionCount,
                })
            );

            // Create unknown items (POST)
            const createPromises = unknownItemsToReceive.map(item =>
                server.post(`/api/barcodes`, {
                    barcode: item.barcode,
                    group: item.group,
                    itemName: item.itemName,
                    itemDescription: item.itemDescription,
                    count: item.totalCount + item.sessionCount,
                    location: item.location,
                    pointsToRedeem: item.pointsToRedeem,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    updatedBy: item.updatedBy,
                })
            );

            await Promise.all([...updatePromises, ...createPromises]);

            setPendingItems(prev => prev.filter(item => !selectedIds.has(item.id)));
            setPendingUnknownItems(prev => prev.filter(item => !selectedIds.has(item.id)));
            setSelectedIds(new Set());

            const totalReceived = knownItemsToReceive.length + unknownItemsToReceive.length;
            showToast("Items Received", `${totalReceived} barcodes saved.`);
        } catch (error) {
            console.error("Error receiving barcodes:", error);
            showToast("Error", "Failed to receive some items.");
        } finally {
            setIsLoading(false);
            setShowReceiveModal(false);
            setCurrentScan("");
            setScannedCode("");
            setIsFocused(false);
        }
    };

    const handleDispatch = async () => {
        setIsLoading(true);
        const dispatchableItems = pendingItems.filter(item =>
            selectedIds.has(item.id) && item.totalCount >= item.sessionCount
        );

        if (dispatchableItems.length === 0) {
            showToast("Dispatch Error", "No selected items have sufficient stock to dispatch.");
            setIsLoading(false);
            return;
        }

        try {
            const updatePromises = dispatchableItems.map(item =>
                server.put(`/api/barcodes/${item.id}`, {
                    barcode: item.barcode,
                    group: item.group,
                    itemName: item.itemName,
                    itemDescription: item.itemDescription,
                    location: item.location,
                    pointsToRedeem: item.pointsToRedeem,
                    count: item.totalCount - item.sessionCount,
                })
            );

            await Promise.all(updatePromises);

            setPendingItems(prev => prev.filter(item => !selectedIds.has(item.id)));
            setPendingUnknownItems(prev => prev.filter(item => !selectedIds.has(item.id)));
            setSelectedIds(new Set());
            showToast("Dispatch Successful", `${dispatchableItems.length} items dispatched.`);
        } catch (error) {
            console.error("Error dispatching barcodes:", error);
            showToast("Dispatch Error", "Failed to dispatch items. Please try again.");
        } finally {
            setIsLoading(false);
            setShowDispatchModal(false);
            setCurrentScan("");
            setScannedCode("");
            setIsFocused(false);
        }
    };

    const handleIncrease = (barcode: string) => {
        const isKnown = pendingItems.some(item => item.barcode === barcode);
        const currentPendingList = isKnown ? pendingItems : pendingUnknownItems;
        const setPendingList = isKnown ? setPendingItems : setPendingUnknownItems;
    
        const updatedList = currentPendingList.map(item =>
            item.barcode === barcode
                ? { ...item, sessionCount: (item.sessionCount || 0) + 1 }
                : item
        );
    
        setPendingList(updatedList);
    };
    
    const handleDecrease = (barcode: string) => {
        const isKnown = pendingItems.some(item => item.barcode === barcode);
        const currentPendingList = isKnown ? pendingItems : pendingUnknownItems;
        const setPendingList = isKnown ? setPendingItems : setPendingUnknownItems;
    
        const updatedList = currentPendingList.map(item =>
            item.barcode === barcode && (item.sessionCount || 0) > 1
                ? { ...item, sessionCount: (item.sessionCount || 1) - 1 }
                : item
        );
    
        setPendingList(updatedList);
    };       

    const saveEditedBarcode = async () => {
        if (!editingItem) return;
        setIsLoading(true);
        const updatedTotalCount = parseInt(editingItemCount) || 0;

        const updatedItem = {
            ...editingItem,
            barcode: editingBarcode.trim(),
            itemName: editingItemName.trim(),
            itemDescription: editingItemDescription.trim(),
            location: editingItemLocation.trim(),
            pointsToRedeem: parseInt(editingItemPointsToRedeem) || 0,
            group: editingItemGroup.trim(),
            totalCount: parseInt(editingItemCount) || 0,
        };

        if (isEditingUnknown) {
            setPendingUnknownItems((prev) =>
                prev.map((item) =>
                    item.id === editingItem.id
                        ? { ...updatedItem, totalCount: updatedTotalCount }
                        : item
                )
            );
        } else {
            try {
                await server.put(`/api/barcodes/${editingItem.id}`, {
                    barcode: editingBarcode.trim(),
                    group: editingItemGroup.trim(),
                    location: editingItemLocation.trim(),
                    pointsToRedeem: parseInt(editingItemPointsToRedeem) || 0,
                    itemName: editingItemName.trim(),
                    itemDescription: editingItemDescription.trim(),
                });

                setPendingItems((prev) =>
                    prev.map((item) =>
                        item.id === editingItem.id ? updatedItem : item
                    )
                );
            } catch (error) {
                console.error("Error updating barcode:", error);
                showToast("Edit failed", "Failed to update barcode. Please try again.");
            }
        }

        setEditingItem(null);
        setShowEditModal(false);
        setIsLoading(false);
        setEditingBarcode(editingItem?.barcode || "");
        setEditingItemName(editingItem?.itemName || "");
        setEditingItemDescription(editingItem?.itemDescription || "");
        setEditingItemCount(editingItem?.totalCount.toString() || "");
        setEditingItemLocation(editingItem?.location || "");
        setEditingItemPointsToRedeem(editingItem?.pointsToRedeem.toString() || "");
        setEditingItemGroup(editingItem?.group || "");
    };

    const saveEditedUnknownItem = () => {
        if (!editingItem) return;
        setIsLoading(true);
        const updatedItem: ScannedItem = {
            ...editingItem,
            barcode: editingBarcode.trim(),
            itemName: editingItemName.trim(),
            itemDescription: editingItemDescription.trim(),
            location: editingItemLocation.trim(),
            pointsToRedeem: parseInt(editingItemPointsToRedeem) || 0,
            totalCount: parseInt(editingItemCount) || editingItem.totalCount,
            group: editingItemGroup.trim(),
        };

        setPendingUnknownItems((prev) => {
            const exists = prev.some(item => item.id === editingItem.id);
            return exists
                ? prev.map(item => (item.id === editingItem.id ? updatedItem : item))
                : [...prev, updatedItem];
        });

        setEditingItem(null);
        setShowUnknownEditModal(false);
        setIsLoading(false);
    };

    const handleCancelUnknownItem = () => {
        setEditingItem(null);
        setShowUnknownEditModal(false);
    };

    const selectedInsufficientStock = [...pendingItems, ...pendingUnknownItems].filter(item => selectedIds.has(item.id)).some(item => item.totalCount < 1);

    // useFocusEffect(
    //     useCallback(() => {
    //         setPendingItems([]);
    //         setPendingUnknownItems([]);
    //         setShowEditModal(false);
    //         setCurrentScan("");
    //         setScannedCode("");
    //         setIsFocused(false);
    //     }, [])
    // );

    return (
        <ProtectedRoute showAuth={false}>
            {(userData) => (
                <LinearGradient
                    colors={isMobileScreen ? ['#00FFDD', '#1B9CFF'] : ['#1B9CFF', '#00FFDD']}
                    start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                    end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                    style={{ flex: 1 }}
                >
                    <HStack style={{ flex: 1, padding: 16, gap: 16 }}>
                        {isMobileScreen ? (
                            <VStack style={{ flex: 1, gap: isMobileScreen ? 0 : 24 }}>
                                <VStack
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "transparent",
                                        padding: isMobileScreen ? 10 : 24
                                    }}
                                >
                                    <VStack
                                        style={{
                                            width: "100%",
                                            maxWidth: 500,
                                            backgroundColor: "white",
                                            borderRadius: 16,
                                            padding: isMobileScreen ? 10 : 32,
                                            gap: isMobileScreen ? 10 : 24,
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 8,
                                            elevation: 4
                                        }}
                                    >
                                        {/* Title Section */}
                                        <VStack style={{ gap: 8, alignItems: "center" }}>
                                            <ScanIcon size={isMobileScreen ? 40 : 32} color="#3b82f6" />
                                            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e293b" }}>
                                                Scan Area
                                            </Text>
                                        </VStack>

                                        {/* Input Field */}
                                        <VStack style={{ gap: 12 }}>
                                            <Input isDisabled={isLoading} variant="outline">
                                                <InputField
                                                    ref={inputRef}
                                                    placeholder={isFocused ? "" : "Scan barcode here..."}
                                                    value={currentScan}
                                                    onChangeText={(text) => {
                                                        setCurrentScan(text);
                                                        if (text.endsWith("\n")) {
                                                            setCurrentScan(text.trim());
                                                            handleScannedItems();
                                                        }
                                                    }}
                                                    onSubmitEditing={handleScannedItems}
                                                    returnKeyType="done"
                                                    onFocus={() => setIsFocused(true)}
                                                    onBlur={() => setIsFocused(false)}
                                                    style={{
                                                        height: 48,
                                                        fontSize: 16,
                                                        textAlign: "center",
                                                        borderRadius: 8,
                                                        backgroundColor: "#f8fafc"
                                                    }}
                                                />
                                            </Input>

                                            {/* Barcode Type Notice */}
                                            <HStack style={{ gap: 8, alignItems: "center", justifyContent: "center" }}>
                                                <AlertTriangleIcon size={isMobileScreen ? 12 : 16} color="#64748b" />
                                                <Text style={{ fontSize: 12, color: "#64748b", textAlign: "center", fontWeight: "500" }}>
                                                    We only accept 1D barcodes
                                                </Text>
                                            </HStack>
                                        </VStack>

                                        {/* Scanned Result Display */}
                                        {scannedCode && (
                                            <VStack
                                                style={{
                                                    backgroundColor: "#f0fdf4",
                                                    borderRadius: 8,
                                                    padding: isMobileScreen ? 6 : 16,
                                                    gap: 8,
                                                    alignItems: "center"
                                                }}
                                            >
                                                <HStack style={{ gap: 8, alignItems: "center", justifyContent: "center", }}>
                                                    <CheckCircleIcon size={isMobileScreen ? 14 : 20} color="#16a34a" />
                                                    <Text style={{ fontSize: 14, fontWeight: "500", color: "#166534" }}>
                                                        Last Scanned:
                                                    </Text>
                                                </HStack>
                                                <Text
                                                    isTruncated={true}
                                                    style={{
                                                        fontSize: isMobileScreen ? 20 : 18,
                                                        fontWeight: "600",
                                                        color: "#166534",
                                                        letterSpacing: 2,
                                                        width: "90%",
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    {scannedCode}
                                                </Text>
                                            </VStack>
                                        )}
                                    </VStack>
                                </VStack>

                                <VStack
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "transparent",
                                        padding: isMobileScreen ? 10 : 24
                                    }}
                                >
                                    <VStack style={{ flex: 1, width: "100%" }}>
                                        <ScrollView style={{ flex: 1, width: "100%" }}>
                                            <VStack style={{ gap: 16, paddingBottom: 16 }}>
                                                {Object.entries(groupedItems).length > 0 ? (
                                                    Object.entries(groupedItems).map(([group, items]) => (
                                                        <VStack key={group} style={{
                                                            gap: 12, backgroundColor: "white", padding: 16, borderRadius: 24,
                                                            shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
                                                            shadowRadius: 12, elevation: 8, marginVertical: 8
                                                        }}>
                                                            {/* Group Header */}
                                                            <HStack style={{
                                                                alignItems: "center", gap: 10, padding: 12,
                                                                backgroundColor: "#eef2ff", borderRadius: 16, marginBottom: 8, flex: 1
                                                            }}>
                                                                <Box style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Checkbox
                                                                        value={`select-group-${group}`}
                                                                        size="md"
                                                                        isChecked={areAllGroupItemsSelected(items)}
                                                                        onChange={() => toggleSelectGroup(group)}
                                                                        style={{
                                                                            display: currentMode === "info" ? "none" : "flex",
                                                                        }}
                                                                    >
                                                                        <CheckboxIndicator style={{
                                                                            backgroundColor: areAllGroupItemsSelected(items) ? "#1B9CFF" : "white",
                                                                            borderColor: "#1B9CFF",
                                                                            borderRadius: 6
                                                                        }}>
                                                                            <CheckboxIcon as={CheckIcon} color="white" />
                                                                        </CheckboxIndicator>
                                                                    </Checkbox>
                                                                </Box>
                                                                <Text style={{
                                                                    fontSize: 20, fontWeight: "900", color: "#4f46e5",
                                                                    letterSpacing: -0.5, textTransform: "uppercase"
                                                                }}>
                                                                    {groupLabels[group] || group}
                                                                </Text>
                                                            </HStack>

                                                            {items.map((item) => (
                                                                <VStack
                                                                    key={item.id}
                                                                    style={{
                                                                        backgroundColor: "#ffffff",
                                                                        borderRadius: 20,
                                                                        padding: 16,
                                                                        marginVertical: 4,
                                                                        shadowColor: "#000",
                                                                        shadowOffset: { width: 0, height: 2 },
                                                                        shadowOpacity: 0.05,
                                                                        shadowRadius: 6,
                                                                        elevation: 2,
                                                                    }}
                                                                >
                                                                    <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                                                                        {/* Selection & Main Info */}
                                                                        <HStack style={{ flex: 1, gap: 12, alignItems: "center" }}>
                                                                            <Box style={{ position: 'relative' }}>
                                                                                <Checkbox
                                                                                    value="selectItems"
                                                                                    size="md"
                                                                                    isChecked={selectedIds.has(item.id)}
                                                                                    onChange={() => toggleSelect(item.id)}
                                                                                    style={{
                                                                                        display: currentMode === "info" ? "none" : "flex",
                                                                                    }}
                                                                                >
                                                                                    <CheckboxIndicator style={{
                                                                                        backgroundColor: selectedIds.has(item.id) ? "#1B9CFF" : "white",
                                                                                        borderColor: "#1B9CFF",
                                                                                        borderRadius: 6
                                                                                    }}>
                                                                                        <CheckboxIcon as={CheckIcon} color="white" />
                                                                                    </CheckboxIndicator>
                                                                                </Checkbox>
                                                                            </Box>

                                                                            {/* Item Details */}
                                                                            <VStack style={{ flex: 1, gap: 6 }}>
                                                                                <HStack style={{ alignItems: "center", gap: 8, justifyContent: "space-between", flexWrap: "wrap", width: "100%" }}>
                                                                                    <Text isTruncated={true} style={{
                                                                                        fontSize: isMobileScreen ? 20 : 18, fontWeight: "800", color: "#1e293b",
                                                                                        textShadowColor: "rgba(79, 70, 229, 0.1)",
                                                                                        textShadowOffset: { width: 1, height: 1 },
                                                                                        textShadowRadius: 2,
                                                                                        flexGrow: 1,
                                                                                        textAlign: "left",
                                                                                        minWidth: isMobileScreen ? "50%" : "auto",
                                                                                        
                                                                                    }}>
                                                                                        {item.barcode}
                                                                                    </Text>
                                                                                    <Box
                                                                                        style={{
                                                                                            backgroundColor: "#f1f5f9",
                                                                                            paddingHorizontal: 6,
                                                                                            paddingVertical: 2,
                                                                                            borderRadius: 6,
                                                                                            flexDirection: "row",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center",
                                                                                            gap: 6,
                                                                                            alignSelf: isMobileScreen ? "flex-end" : "center",
                                                                                            marginTop: isMobileScreen ? 8 : 0,
                                                                                        }}
                                                                                    >
                                                                                        <Button onPress={() => handleDecrease(item.barcode)} style={{ backgroundColor: "transparent" }}>
                                                                                            <ButtonText style={{ fontSize: 18, fontWeight: "700", color: "#94a3b8" }}>−</ButtonText>
                                                                                        </Button>

                                                                                        <Text
                                                                                            style={{
                                                                                                fontSize: 16,
                                                                                                fontWeight: "700",
                                                                                                color: "#64748b",
                                                                                                textAlign: "center",
                                                                                                minWidth: 24,
                                                                                            }}
                                                                                        >
                                                                                            X{item.sessionCount}
                                                                                        </Text>

                                                                                        <Button onPress={() => handleIncrease(item.barcode)} style={{ backgroundColor: "transparent" }}>
                                                                                            <ButtonText style={{ fontSize: 18, fontWeight: "700", color: "#94a3b8" }}>+</ButtonText>
                                                                                        </Button>
                                                                                    </Box>
                                                                                </HStack>

                                                                                <Text isTruncated={true} style={{
                                                                                    fontSize: isMobileScreen ? 20 : 18,
                                                                                    fontWeight: "600",
                                                                                    color: "#334155",
                                                                                    fontStyle: item.itemName ? "normal" : "italic"
                                                                                }}>
                                                                                    {item.itemName || "Unnamed Product"}
                                                                                </Text>

                                                                                <Text isTruncated={true} style={{
                                                                                    fontSize: isMobileScreen ? 12 : 14,
                                                                                    fontWeight: "600",
                                                                                    color: "#334155",
                                                                                    fontStyle: item.itemName ? "normal" : "italic"
                                                                                }}>
                                                                                    {item.itemDescription || "No Description"}
                                                                                </Text>

                                                                                <HStack style={{ gap: 8, flexWrap: "wrap" }}>
                                                                                    <HStack style={{
                                                                                        backgroundColor: "#f8fafc",
                                                                                        padding: 6,
                                                                                        borderRadius: 8,
                                                                                        alignItems: "center",
                                                                                        gap: 4
                                                                                    }}>
                                                                                        <WarehouseIcon size={14} color="#94a3b8" style={{ minWidth: 14 }} />
                                                                                        <Text isTruncated={true} style={{ fontSize: 14, color: "#64748b", fontWeight: "500" }}>
                                                                                            {item.location || "Unknown Location"}
                                                                                        </Text>
                                                                                    </HStack>

                                                                                    <HStack style={{
                                                                                        backgroundColor: item.totalCount <= 10 ? "#fef2f2" : item.totalCount <= 100 ? "#fefce8" : "#f0fdf4",
                                                                                        padding: 6,
                                                                                        borderRadius: 8,
                                                                                        alignItems: "center",
                                                                                        gap: 8
                                                                                    }}>
                                                                                        <Box style={{ minWidth: 8, width: 8, height: 8, backgroundColor: item.totalCount <= 10 ? "#fca5a5" : item.totalCount <= 100 ? "#fde68a" : "#86efac", borderRadius: 4, marginLeft: 4 }} />
                                                                                        <Text isTruncated={true} style={{
                                                                                            fontSize: 14,
                                                                                            color: item.totalCount <= 10 ? "#991b1b" : item.totalCount <= 100 ? "#92400e" : "#166534",
                                                                                            fontWeight: "600"
                                                                                        }}>
                                                                                            Stock: {item.totalCount}
                                                                                        </Text>
                                                                                    </HStack>
                                                                                </HStack>
                                                                            </VStack>
                                                                        </HStack>

                                                                        {/* Action Buttons */}
                                                                        <HStack style={{ gap: 8, alignItems: "center" }}>
                                                                            <Button
                                                                                size="md"
                                                                                action="secondary"
                                                                                onPress={() => handleEdit(item)}
                                                                                isDisabled={isLoading}
                                                                                style={{
                                                                                    padding: 8,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: "transparent"
                                                                                }}
                                                                            >
                                                                                <PencilIcon size={20} color="#4f46e5" />
                                                                            </Button>

                                                                            <Button
                                                                                size="md"
                                                                                action="secondary"
                                                                                onPress={() => handleRemove(item.id)}
                                                                                isDisabled={isLoading}
                                                                                style={{
                                                                                    padding: 8,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: "transparent"
                                                                                }}
                                                                            >
                                                                                <MinusCircleIcon size={20} color="#dc2626" />
                                                                            </Button>
                                                                        </HStack>
                                                                    </HStack>

                                                                    {/* Points Display*/}
                                                                    <HStack style={{
                                                                        marginTop: 12,
                                                                        padding: 10,
                                                                        borderRadius: 12,
                                                                        backgroundColor: "rgba(255, 215, 0, 0.1)",
                                                                        borderWidth: 1,
                                                                        borderColor: "rgba(255, 215, 0, 0.3)",
                                                                        alignItems: "center",
                                                                        gap: 8
                                                                    }}>
                                                                        <SparklesIcon size={16} color="#eab308" style={{ minWidth: 16 }} />
                                                                        <Text isTruncated={true} style={{
                                                                            fontSize: 16,
                                                                            fontWeight: "700",
                                                                            color: "#eab308",
                                                                            textShadowColor: "rgba(234, 179, 8, 0.2)",
                                                                            textShadowOffset: { width: 0, height: 0 },
                                                                            textShadowRadius: 4
                                                                        }}>
                                                                            Required Points: {item.pointsToRedeem}
                                                                        </Text>
                                                                    </HStack>
                                                                </VStack>
                                                            ))}
                                                        </VStack>
                                                    ))
                                                ) : (
                                                    <VStack
                                                        style={{
                                                            margin: "auto",
                                                            width: "100%",
                                                            maxWidth: 500,
                                                            backgroundColor: "#f8fafc",
                                                            borderRadius: 16,
                                                            padding: 32,
                                                            gap: 16,
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            shadowColor: "#000",
                                                            shadowOffset: { width: 0, height: 4 },
                                                            shadowOpacity: 0.1,
                                                            shadowRadius: 8,
                                                            elevation: 4
                                                        }}
                                                    >
                                                        <HStack style={{ gap: 8, alignItems: "center" }}>
                                                            <ScanIcon size={24} color="#3b82f6" />
                                                            <Text
                                                                style={{
                                                                    fontSize: 14,
                                                                    fontWeight: "600",
                                                                    color: "black",
                                                                    textAlign: "center",
                                                                    letterSpacing: 1
                                                                }}
                                                            >
                                                                Scan results will appear here!
                                                            </Text>
                                                        </HStack>
                                                    </VStack>
                                                )}
                                            </VStack>
                                        </ScrollView>
                                    </VStack>
                                </VStack>
                            </VStack>
                        ) : (
                            <>
                                <VStack
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "transparent",
                                        padding: 24
                                    }}
                                >
                                    <VStack
                                        style={{
                                            width: "100%",
                                            maxWidth: 500,
                                            backgroundColor: "white",
                                            borderRadius: 16,
                                            padding: 32,
                                            gap: 24,
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 8,
                                            elevation: 4
                                        }}
                                    >
                                        {/* Title Section */}
                                        <VStack style={{ gap: 8, alignItems: "center" }}>
                                            <ScanIcon size={32} color="#3b82f6" />
                                            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e293b" }}>
                                                Scan Area
                                            </Text>
                                        </VStack>

                                        {/* Input Field */}
                                        <VStack style={{ gap: 12 }}>
                                            <Input isDisabled={isLoading} variant="outline">
                                                <InputField
                                                    ref={inputRef}
                                                    placeholder={isFocused ? "" : "Scan barcode here..."}
                                                    value={currentScan}
                                                    onChangeText={(text) => {
                                                        setCurrentScan(text);
                                                        if (text.endsWith("\n")) {
                                                            setCurrentScan(text.trim());
                                                            handleScannedItems();
                                                        }
                                                    }}
                                                    onSubmitEditing={handleScannedItems}
                                                    returnKeyType="done"
                                                    onFocus={() => setIsFocused(true)}
                                                    onBlur={() => setIsFocused(false)}
                                                    style={{
                                                        height: 48,
                                                        fontSize: 16,
                                                        textAlign: "center",
                                                        borderRadius: 8,
                                                        backgroundColor: "#f8fafc"
                                                    }}
                                                />
                                            </Input>

                                            {/* Barcode Type Notice */}
                                            <HStack style={{ gap: 8, alignItems: "center", justifyContent: "center" }}>
                                                <AlertTriangleIcon size={16} color="#64748b" />
                                                <Text style={{ fontSize: 12, color: "#64748b", textAlign: "center", fontWeight: "500" }}>
                                                    We only accept 1D barcodes
                                                </Text>
                                            </HStack>
                                        </VStack>

                                        {/* Scanned Result Display */}
                                        {scannedCode && (
                                            <VStack
                                                style={{
                                                    backgroundColor: "#f0fdf4",
                                                    borderRadius: 8,
                                                    padding: 16,
                                                    gap: 8,
                                                    alignItems: "center"
                                                }}
                                            >
                                                <HStack style={{ gap: 8, alignItems: "center" }}>
                                                    <CheckCircleIcon size={20} color="#16a34a" />
                                                    <Text style={{ fontSize: 14, fontWeight: "500", color: "#166534" }}>
                                                        Last Scanned:
                                                    </Text>
                                                </HStack>
                                                <Text
                                                    isTruncated={true}
                                                    style={{
                                                        fontSize: 24,
                                                        fontWeight: "600",
                                                        color: "#166534",
                                                        letterSpacing: 2,
                                                        width: "90%",
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    {scannedCode}
                                                </Text>
                                            </VStack>
                                        )}
                                    </VStack>
                                </VStack>

                                <VStack
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "transparent",
                                        padding: isMobileScreen ? 10 : 24
                                    }}
                                >
                                    <VStack style={{ width: "100%" }}>
                                        <ScrollView style={{ flex: 1, width: "100%" }}>
                                            <VStack style={{ gap: 16, paddingBottom: 16 }}>
                                                {Object.entries(groupedItems).length > 0 ? (
                                                    Object.entries(groupedItems).map(([group, items]) => (
                                                        <VStack key={group} style={{
                                                            gap: 12, backgroundColor: "white", padding: 16, borderRadius: 24,
                                                            shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
                                                            shadowRadius: 12, elevation: 8, marginVertical: 8
                                                        }}>
                                                            {/* Group Header */}
                                                            <HStack style={{
                                                                alignItems: "center", gap: 10, padding: 12,
                                                                backgroundColor: "#eef2ff", borderRadius: 16, marginBottom: 8, flex: 1
                                                            }}>
                                                                <Box style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Checkbox
                                                                        value={`select-group-${group}`}
                                                                        size="md"
                                                                        isChecked={areAllGroupItemsSelected(items)}
                                                                        onChange={() => toggleSelectGroup(group)}
                                                                        style={{
                                                                            display: currentMode === "info" ? "none" : "flex",
                                                                        }}
                                                                    >
                                                                        <CheckboxIndicator style={{
                                                                            backgroundColor: areAllGroupItemsSelected(items) ? "#1B9CFF" : "white",
                                                                            borderColor: "#1B9CFF",
                                                                            borderRadius: 6
                                                                        }}>
                                                                            <CheckboxIcon as={CheckIcon} color="white" />
                                                                        </CheckboxIndicator>
                                                                    </Checkbox>
                                                                </Box>
                                                                <Text style={{
                                                                    fontSize: 20, fontWeight: "900", color: "#4f46e5",
                                                                    letterSpacing: -0.5, textTransform: "uppercase"
                                                                }}>
                                                                    {groupLabels[group] || group}
                                                                </Text>
                                                            </HStack>

                                                            {items.map((item) => (
                                                                <VStack
                                                                    key={item.id}
                                                                    style={{
                                                                        backgroundColor: "#ffffff",
                                                                        borderRadius: 20,
                                                                        padding: 16,
                                                                        marginVertical: 4,
                                                                        shadowColor: "#000",
                                                                        shadowOffset: { width: 0, height: 2 },
                                                                        shadowOpacity: 0.05,
                                                                        shadowRadius: 6,
                                                                        elevation: 2,
                                                                    }}
                                                                >
                                                                    <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                                                                        {/* Selection & Main Info */}
                                                                        <HStack style={{ flex: 1, gap: 12, alignItems: "center" }}>
                                                                            <Box style={{ position: 'relative' }}>
                                                                                <Checkbox
                                                                                    value="selectItems"
                                                                                    size="md"
                                                                                    isChecked={selectedIds.has(item.id)}
                                                                                    onChange={() => toggleSelect(item.id)}
                                                                                    style={{
                                                                                        display: currentMode === "info" ? "none" : "flex",
                                                                                    }}
                                                                                >
                                                                                    <CheckboxIndicator style={{
                                                                                        backgroundColor: selectedIds.has(item.id) ? "#1B9CFF" : "white",
                                                                                        borderColor: "#1B9CFF",
                                                                                        borderRadius: 6
                                                                                    }}>
                                                                                        <CheckboxIcon as={CheckIcon} color="white" />
                                                                                    </CheckboxIndicator>
                                                                                </Checkbox>
                                                                            </Box>

                                                                            {/* Item Details */}
                                                                            <VStack style={{ flex: 1, gap: 6 }}>
                                                                                <HStack style={{ alignItems: "center", gap: 8, justifyContent: "flex-start", flexWrap: "wrap", width: "100%" }}>
                                                                                    <Text isTruncated={true} style={{
                                                                                        fontSize: isMobileScreen ? 20 : 18, fontWeight: "800", color: "#1e293b",
                                                                                        textShadowColor: "rgba(79, 70, 229, 0.1)",
                                                                                        textShadowOffset: { width: 1, height: 1 },
                                                                                        textShadowRadius: 2,
                                                                                        width: "auto"
                                                                                    }}>
                                                                                        {item.barcode}
                                                                                    </Text>
                                                                                    <Box
                                                                                        style={{
                                                                                            backgroundColor: "#f1f5f9",
                                                                                            paddingHorizontal: 6,
                                                                                            paddingVertical: 2,
                                                                                            borderRadius: 6,
                                                                                            flexDirection: "row",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center",
                                                                                            alignSelf: "center",
                                                                                        }}
                                                                                    >
                                                                                        <Button onPress={() => handleDecrease(item.barcode)} style={{ backgroundColor: "transparent" }}>
                                                                                            <ButtonText style={{ fontSize: 18, fontWeight: "700", color: "#94a3b8" }}>−</ButtonText>
                                                                                        </Button>

                                                                                        <Text
                                                                                            style={{
                                                                                                fontSize: 16,
                                                                                                fontWeight: "700",
                                                                                                color: "#64748b",
                                                                                                textAlign: "center",
                                                                                                minWidth: 24,
                                                                                            }}
                                                                                        >
                                                                                            X{item.sessionCount}
                                                                                        </Text>

                                                                                        <Button onPress={() => handleIncrease(item.barcode)} style={{ backgroundColor: "transparent" }}>
                                                                                            <ButtonText style={{ fontSize: 18, fontWeight: "700", color: "#94a3b8" }}>+</ButtonText>
                                                                                        </Button>
                                                                                    </Box>
                                                                                </HStack>

                                                                                <Text isTruncated={true} style={{
                                                                                    fontSize: isMobileScreen ? 20 : 18,
                                                                                    fontWeight: "600",
                                                                                    color: "#334155",
                                                                                    fontStyle: item.itemName ? "normal" : "italic"
                                                                                }}>
                                                                                    {item.itemName || "Unnamed Product"}
                                                                                </Text>

                                                                                <Text isTruncated={true} style={{
                                                                                    fontSize: isMobileScreen ? 12 : 14,
                                                                                    fontWeight: "600",
                                                                                    color: "#334155",
                                                                                    fontStyle: item.itemName ? "normal" : "italic"
                                                                                }}>
                                                                                    {item.itemDescription || "No Description"}
                                                                                </Text>

                                                                                <HStack style={{ gap: 8, flexWrap: "wrap" }}>
                                                                                    <HStack style={{
                                                                                        backgroundColor: "#f8fafc",
                                                                                        padding: 6,
                                                                                        borderRadius: 8,
                                                                                        alignItems: "center",
                                                                                        gap: 4
                                                                                    }}>
                                                                                        <WarehouseIcon size={14} color="#94a3b8" style={{ minWidth: 14 }} />
                                                                                        <Text isTruncated={true} style={{ fontSize: 14, color: "#64748b", fontWeight: "500" }}>
                                                                                            {item.location || "Unknown Location"}
                                                                                        </Text>
                                                                                    </HStack>

                                                                                    <HStack style={{
                                                                                        backgroundColor: item.totalCount <= 10 ? "#fef2f2" : item.totalCount <= 100 ? "#fefce8" : "#f0fdf4",
                                                                                        padding: 6,
                                                                                        borderRadius: 8,
                                                                                        alignItems: "center",
                                                                                        gap: 8
                                                                                    }}>
                                                                                        <Box style={{ minWidth: 8, width: 8, height: 8, backgroundColor: item.totalCount <= 10 ? "#fca5a5" : item.totalCount <= 100 ? "#fde68a" : "#86efac", borderRadius: 4, marginLeft: 4 }} />
                                                                                        <Text isTruncated={true} style={{
                                                                                            fontSize: 14,
                                                                                            color: item.totalCount <= 10 ? "#991b1b" : item.totalCount <= 100 ? "#92400e" : "#166534",
                                                                                            fontWeight: "600"
                                                                                        }}>
                                                                                            Stock: {item.totalCount}
                                                                                        </Text>
                                                                                    </HStack>
                                                                                </HStack>
                                                                            </VStack>
                                                                        </HStack>

                                                                        {/* Action Buttons */}
                                                                        <HStack style={{ gap: 8, alignItems: "center" }}>
                                                                            <Button
                                                                                size="md"
                                                                                action="secondary"
                                                                                onPress={() => handleEdit(item)}
                                                                                isDisabled={isLoading}
                                                                                style={{
                                                                                    padding: 8,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: "transparent"
                                                                                }}
                                                                            >
                                                                                <PencilIcon size={20} color="#4f46e5" />
                                                                            </Button>

                                                                            <Button
                                                                                size="md"
                                                                                action="secondary"
                                                                                onPress={() => handleRemove(item.id)}
                                                                                isDisabled={isLoading}
                                                                                style={{
                                                                                    padding: 8,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: "transparent"
                                                                                }}
                                                                            >
                                                                                <MinusCircleIcon size={20} color="#dc2626" />
                                                                            </Button>
                                                                        </HStack>
                                                                    </HStack>

                                                                    {/* Points Display*/}
                                                                    <HStack style={{
                                                                        marginTop: 12,
                                                                        padding: 10,
                                                                        borderRadius: 12,
                                                                        backgroundColor: "rgba(255, 215, 0, 0.1)",
                                                                        borderWidth: 1,
                                                                        borderColor: "rgba(255, 215, 0, 0.3)",
                                                                        alignItems: "center",
                                                                        gap: 8
                                                                    }}>
                                                                        <SparklesIcon size={16} color="#eab308" style={{ minWidth: 16 }} />
                                                                        <Text isTruncated={true} style={{
                                                                            fontSize: 16,
                                                                            fontWeight: "700",
                                                                            color: "#eab308",
                                                                            textShadowColor: "rgba(234, 179, 8, 0.2)",
                                                                            textShadowOffset: { width: 0, height: 0 },
                                                                            textShadowRadius: 4
                                                                        }}>
                                                                            Required Points: {item.pointsToRedeem}
                                                                        </Text>
                                                                    </HStack>
                                                                </VStack>
                                                            ))}
                                                        </VStack>
                                                    ))
                                                ) : (
                                                    <VStack
                                                        style={{
                                                            margin: "auto",
                                                            width: "100%",
                                                            maxWidth: 500,
                                                            backgroundColor: "#f8fafc",
                                                            borderRadius: 16,
                                                            padding: 32,
                                                            gap: 16,
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            shadowColor: "#000",
                                                            shadowOffset: { width: 0, height: 4 },
                                                            shadowOpacity: 0.1,
                                                            shadowRadius: 8,
                                                            elevation: 4
                                                        }}
                                                    >
                                                        <HStack style={{ gap: 8, alignItems: "center" }}>
                                                            <ScanIcon size={24} color="#3b82f6" />
                                                            <Text
                                                                style={{
                                                                    fontSize: 16,
                                                                    fontWeight: "600",
                                                                    color: "black",
                                                                    textAlign: "center",
                                                                    letterSpacing: 1
                                                                }}
                                                            >
                                                                Scan results will appear here!
                                                            </Text>
                                                        </HStack>
                                                    </VStack>
                                                )}
                                            </VStack>
                                        </ScrollView>
                                    </VStack>
                                </VStack>
                            </>
                        )}
                    </HStack>
                    <HStack
                        style={{
                            justifyContent: currentMode === "info" ? "center" : "space-between",
                            paddingTop: 12,
                            paddingBottom: 12,
                            paddingLeft: isMobileScreen ? 10 : 20,
                            paddingRight: isMobileScreen ? 10 : 20,
                            backgroundColor: "white",
                            display: (pendingItems.length + pendingUnknownItems.length) > 0 ? "flex" : "none",
                        }}
                    >
                        <HStack space={isMobileScreen ? "xs" : "sm"} style={{ alignItems: "center", width: "auto" }}>
                            <Checkbox
                                value="selectAll"
                                size={isMobileScreen ? "sm" : "md"}
                                isChecked={allSelected}
                                onChange={(isChecked) => {
                                    isChecked ? selectAll() : unselectAll();
                                }}
                                style={{
                                    display: currentMode !== "info" ? "flex" : "none"
                                }}
                            >
                                <CheckboxIndicator style={{ backgroundColor: allSelected ? "#1B9CFF" : "white", borderColor: "#1B9CFF" }}>
                                    <CheckboxIcon as={CheckIcon} color="white" />
                                </CheckboxIndicator>
                            </Checkbox>
                            <Text size={isMobileScreen ? "xs" : "md"} style={{ color: "black", display: currentMode !== "info" ? "flex" : "none" }} >
                                {allSelected ? "Unselect All" : "Select All"}
                            </Text>
                            <Button
                                variant="solid"
                                action="negative"
                                size={isMobileScreen ? "xs" : "md"}
                                onPress={handleClearResults}
                                isDisabled={isLoading}
                                style={{ marginLeft: 8 }}
                            >
                                <MinusCircleIcon size={16} color="white" style={{ display: isMobileScreen ? "none" : "flex" }} />
                                <ButtonText size={isMobileScreen ? "xs" : "md"}>Clear All</ButtonText>
                            </Button>
                        </HStack>

                        <HStack space={isMobileScreen && currentMode === "dispatch" ? "xs" : "xl"} style={{ alignItems: "center", width: "auto" }}>
                            {selectedInsufficientStock && currentMode == "dispatch" && (
                                <Text style={{ color: "red", fontWeight: "500" }} size={isMobileScreen ? "xs" : "md"} >
                                    Not enough stock to dispatch.
                                </Text>
                            )}
                            <Button
                                onPress={() => setShowReceiveModal(true)}
                                isDisabled={selectedIds.size === 0 || isLoading}
                                size={isMobileScreen ? "xs" : "md"}
                                style={{
                                    display: currentMode === "receive" ? "flex" : "none",
                                    backgroundColor: "#1B9CFF",
                                    opacity: selectedIds.size === 0 || isLoading ? 0.5 : 1,
                                }}
                            >
                                <ArrowDownCircle size={16} color="white" style={{ display: isMobileScreen ? "none" : "flex" }} />
                                <ButtonText size={isMobileScreen ? "xs" : "md"}>Receive</ButtonText>
                            </Button>

                            <Button
                                onPress={() => setShowDispatchModal(true)}
                                isDisabled={selectedIds.size === 0 || isLoading || selectedInsufficientStock}
                                size={isMobileScreen ? "xs" : "md"}
                                style={{
                                    display: currentMode === "dispatch" ? "flex" : "none",
                                    backgroundColor: "#1B9CFF",
                                    opacity: selectedIds.size === 0 || isLoading || selectedInsufficientStock ? 0.5 : 1,
                                }}
                            >
                                <ArrowUpCircle size={16} color="white" style={{ display: isMobileScreen ? "none" : "flex" }} />
                                <ButtonText size={isMobileScreen ? "xs" : "md"}>Dispatch</ButtonText>
                            </Button>
                        </HStack>
                    </HStack>

                    {/* Known Items Editing Modal */}
                    <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading size="md" className="text-typography-950">Edit Items</Heading>
                                <ModalCloseButton style={{ backgroundColor: "transparent" }}>
                                    <Icon
                                        as={CloseIcon}
                                        size="md"
                                        className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
                                    />
                                </ModalCloseButton>
                            </ModalHeader>
                            <ModalBody>
                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Barcode</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingBarcode} onChangeText={setEditingBarcode} placeholder="Enter Item's Barcode" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Name</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemName} onChangeText={setEditingItemName} placeholder="Enter Item Name" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Description</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemDescription} onChangeText={setEditingItemDescription} placeholder="Enter Item Description" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Group</FormControlLabelText>
                                    </FormControlLabel>
                                    <Select isDisabled={isLoading} selectedValue={editingItemGroup} onValueChange={setEditingItemGroup}>
                                        <SelectTrigger variant="outline" size="md">
                                            <SelectInput value={groupLabels[editingItemGroup]} placeholder="Select Item Group" />
                                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                        </SelectTrigger>
                                        <SelectPortal>
                                            <SelectBackdrop />
                                            <SelectContent >
                                                <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                                {Object.entries(groupLabels).map(([value, label]) => (
                                                    <SelectItem key={value} label={label} value={value} />
                                                ))}
                                            </SelectContent>
                                        </SelectPortal>
                                    </Select>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Location</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemLocation} onChangeText={setEditingItemLocation} placeholder="Enter Item Warehouse Location" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Count</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemCount} onChangeText={setEditingItemCount} placeholder="Enter Item Stock Count" keyboardType="numeric" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl>
                                    <FormControlLabel>
                                        <FormControlLabelText>Points to Redeem</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemPointsToRedeem} onChangeText={setEditingItemPointsToRedeem} placeholder="Enter Points To Redeem For Item" keyboardType="numeric" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="solid" action="negative" onPress={() => setShowEditModal(false)}>
                                    <ButtonText>Cancel</ButtonText>
                                </Button>
                                <Button variant="solid" action="primary" style={{ backgroundColor: "#1B9CFF" }} onPress={saveEditedBarcode} isDisabled={isLoading || !hasChanges}>
                                    <ButtonText>Save</ButtonText>
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>


                    {/* Unknown Items Editing Modal */}
                    <Modal
                        isOpen={showUnknownEditModal}
                        onClose={() => setShowUnknownEditModal(false)}
                        size="lg"
                    >
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading size="md" className="text-typography-950">
                                    Add New Item
                                </Heading>
                                <ModalCloseButton style={{ backgroundColor: "transparent" }}>
                                    <Icon
                                        as={CloseIcon}
                                        size="md"
                                        className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
                                    />
                                </ModalCloseButton>
                            </ModalHeader>
                            <ModalBody>
                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Barcode</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingBarcode} onChangeText={setEditingBarcode} placeholder="Enter Item's Barcode" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Name</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemName} onChangeText={setEditingItemName} placeholder="Enter Item Name" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Description</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemDescription} onChangeText={setEditingItemDescription} placeholder="Enter Item Description" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Group</FormControlLabelText>
                                    </FormControlLabel>
                                    <Select isDisabled={isLoading} selectedValue={editingItemGroup} onValueChange={setEditingItemGroup}>
                                        <SelectTrigger variant="outline" size="md">
                                            <SelectInput value={groupLabels[editingItemGroup]} placeholder="Select Item Group" />
                                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                        </SelectTrigger>
                                        <SelectPortal>
                                            <SelectBackdrop />
                                            <SelectContent>
                                                <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                                {Object.entries(groupLabels).map(([value, label]) => (
                                                    <SelectItem key={value} label={label} value={value} />
                                                ))}
                                            </SelectContent>
                                        </SelectPortal>
                                    </Select>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Warehouse Location</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemLocation} onChangeText={setEditingItemLocation} placeholder="Enter Item Warehouse Location" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Count</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemCount} onChangeText={setEditingItemCount} placeholder="Enter Item Stock Count" keyboardType="numeric" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>

                                <FormControl>
                                    <FormControlLabel>
                                        <FormControlLabelText>Points to Redeem</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemPointsToRedeem} onChangeText={setEditingItemPointsToRedeem} placeholder="Enter Points To Redeem For Item" keyboardType="numeric" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                </FormControl>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="solid"
                                    action="negative"
                                    onPress={handleCancelUnknownItem}
                                    isDisabled={isLoading}
                                >
                                    <ButtonText>Cancel</ButtonText>
                                </Button>
                                <Button
                                    variant="solid"
                                    action="primary"
                                    style={{ backgroundColor: "#1B9CFF" }}
                                    onPress={saveEditedUnknownItem}
                                    isDisabled={isLoading || !hasChanges}
                                >
                                    <ButtonText>Save</ButtonText>
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>

                    {/* Receive Confirmation Modal */}
                    <Modal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} size="md">
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading size="md">Confirm Receive</Heading>
                                <ModalCloseButton style={{ backgroundColor: "transparent" }}>
                                    <Icon
                                        as={CloseIcon}
                                        size="md"
                                        className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
                                    />
                                </ModalCloseButton>
                            </ModalHeader>
                            <ModalBody>
                                <Text size="sm">Are you sure you want to receive all selected items?</Text>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="solid" action="negative" onPress={() => setShowReceiveModal(false)}>
                                    <ButtonText>Cancel</ButtonText>
                                </Button>
                                <Button
                                    variant="solid"
                                    action="primary"
                                    style={{ backgroundColor: "#1B9CFF" }}
                                    onPress={() => {
                                        handleReceive();
                                        setShowReceiveModal(false);
                                    }}
                                >
                                    <ButtonText>Confirm</ButtonText>
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>

                    {/* Dispatch Confirmation Modal */}
                    <Modal isOpen={showDispatchModal} onClose={() => setShowDispatchModal(false)} size="md">
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading size="md">Confirm Dispatch</Heading>
                                <ModalCloseButton style={{ backgroundColor: "transparent" }}>
                                    <Icon
                                        as={CloseIcon}
                                        size="md"
                                        className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
                                    />
                                </ModalCloseButton>
                            </ModalHeader>
                            <ModalBody>
                                <Text size="sm">
                                    Are you sure you want to dispatch the selected items? This will deduct the dispatched quantity from the available stock. Note: Only items with sufficient stock will be dispatched.
                                </Text>
                            </ModalBody>
                            <ModalFooter style={{ gap: 12 }}>
                                <Button
                                    variant="solid"
                                    action="negative"
                                    onPress={() => setShowDispatchModal(false)}
                                >
                                    <ButtonText style={{ color: "white" }}>Cancel</ButtonText>
                                </Button>

                                <Button
                                    onPress={handleDispatch}
                                    variant="solid"
                                    action="primary"
                                    style={{ backgroundColor: "#1B9CFF" }}
                                >
                                    <ButtonText style={{ color: "white" }}>Confirm</ButtonText>
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </LinearGradient>
            )}
        </ProtectedRoute>
    );
}
