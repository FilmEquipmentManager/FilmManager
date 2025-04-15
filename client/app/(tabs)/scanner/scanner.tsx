import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { ScrollView } from "react-native";
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
import { Icon, CloseIcon, CheckIcon, ChevronDownIcon } from "@/components/ui/icon";
import Constants from "expo-constants";
import server from "../../../networking";
import ProtectedRoute from "@/app/wrappers/ProtectedRoute";
import { useFocusEffect } from "expo-router";

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

    const groupLabels = { camera: "Camera", lighting: "Lighting", audio: "Audio", lenses: "Lenses", accessories: "Accessories", grip: "Grip Equipment", power: "Power Supply", cables: "Cables", misc: "Miscellaneous", unknown: "Unknown" };

    const inputRef = useRef<any>(null);

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

                const existingPendingItem = currentPendingList.find(item => item.barcode === barcodeToScan);

                let newPendingItems: ScannedItem[];

                if (existingPendingItem) {
                    newPendingItems = currentPendingList.map(item =>
                        item.barcode === barcodeToScan
                            ? { ...item, sessionCount: (item.sessionCount || 0) + 1 }
                            : item
                    );
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
                            group: "Unknown",
                            itemName: "Item Name",
                            itemDescription: "Item Description",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            updatedBy: "You",
                            totalCount: 0,
                            sessionCount: 1,
                            location: "Unknown Location",
                            pointsToRedeem: 0,
                        };

                    newPendingItems = [...currentPendingList, newItem];
                }

                setPendingList(newPendingItems);
                setCurrentScan("");
                setIsLoading(false);
            } catch (error) {
                console.error("Error checking barcode:", error);
                showToast("Scan failed", "Could not verify barcode with the server.");
                setIsLoading(false);
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
        }
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

    const handleDelete = async (id: string) => {
        setIsLoading(true);
        try {
            await server.delete(`/api/barcodes/${id}`);
            setPendingItems((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            console.error("Error deleting barcode:", error);
            showToast("Delete failed", "Failed to delete barcode. Please try again.");
        }
        setIsLoading(false);
        setShowEditModal(false);
    }

    const selectedInsufficientStock = [...pendingItems, ...pendingUnknownItems].filter(item => selectedIds.has(item.id)).some(item => item.totalCount < 1);

    useFocusEffect(
        useCallback(() => {
            setPendingItems([]);
            setPendingUnknownItems([]);
            setShowEditModal(false);
        }, [])
    );

    return (
        <ProtectedRoute showAuth={false}>
            {(userData) => (
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
                                    handleScannedItems();
                                }
                            }}
                            onSubmitEditing={handleScannedItems}
                            returnKeyType="done"
                            showSoftInputOnFocus={false}
                            onBlur={() => inputRef.current?.focus()}
                            style={{ height: 40, width: "100%" }}
                        />
                    </Input>

                    <ScrollView style={{ flex: 1, width: "100%" }}>
                        <VStack style={{ gap: 8, paddingBottom: 16 }}>
                            {Object.entries(groupedItems).length > 0 ? (
                                Object.entries(groupedItems).map(([group, items]) => (
                                    <VStack key={group} style={{ gap: 8 }}>
                                        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 16 }}>
                                            {groupLabels[group] || group}
                                        </Text>

                                        {items.map((item) => (
                                            <VStack
                                                key={item.id}
                                                style={{
                                                    borderBottomWidth: 1,
                                                    borderColor: "$gray3",
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 8,
                                                    backgroundColor: "$backgroundCard",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <HStack
                                                    style={{
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    <Checkbox
                                                        value="selectItems"
                                                        size="sm"
                                                        isChecked={selectedIds.has(item.id)}
                                                        onChange={() => toggleSelect(item.id)}
                                                        style={{ marginRight: 8 }}
                                                    >
                                                        <CheckboxIndicator>
                                                            <CheckboxIcon as={CheckIcon} color="white" />
                                                        </CheckboxIndicator>
                                                    </Checkbox>

                                                    <VStack style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                                                            {item.barcode}{" "}
                                                            <Text style={{ color: "gray" }}>x{item.sessionCount}</Text>
                                                        </Text>
                                                        <Text style={{ color: "gray" }}>
                                                            {item.itemName || "Unknown"} - {item.itemDescription || "No description"}
                                                        </Text>
                                                        <Text style={{ fontSize: 12, color: "gray10" }}>
                                                            Location: {item.location || "Unknown"}
                                                        </Text>
                                                        <Text style={{ fontSize: 12, color: "gray10" }}>
                                                            In Stock: {item.totalCount ?? 0}
                                                        </Text>
                                                        <Text style={{ fontSize: 12, color: "gray10" }}>
                                                            Points: {item.pointsToRedeem ?? 0}
                                                        </Text>
                                                        <Text style={{ fontSize: 12, color: "gray10" }}>
                                                            Updated By: {item.updatedBy === "You" ? userData.username : item.updatedBy}
                                                        </Text>
                                                    </VStack>

                                                    <HStack style={{ gap: 4 }}>
                                                        <Button size="sm" onPress={() => handleEdit(item)} isDisabled={isLoading}>
                                                            <ButtonText>Edit</ButtonText>
                                                        </Button>
                                                        <Button size="sm" onPress={() => handleRemove(item.id)} isDisabled={isLoading}>
                                                            <ButtonText>Remove</ButtonText>
                                                        </Button>
                                                        <Button size="sm" onPress={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }} isDisabled={isLoading}>
                                                            <ButtonText>Delete</ButtonText>
                                                        </Button>
                                                    </HStack>
                                                </HStack>
                                            </VStack>
                                        ))}
                                    </VStack>
                                ))
                            ) : (
                                <Text style={{ color: "$gray11" }}>Scan results will appear here</Text>
                            )}
                        </VStack>

                        <Modal
                            isOpen={showEditModal}
                            onClose={() => setShowEditModal(false)}
                            size="lg"
                        >
                            <ModalBackdrop />
                            <ModalContent>
                                <ModalHeader>
                                    <Heading size="md" className="text-typography-950">
                                        Edit Items
                                    </Heading>
                                    <ModalCloseButton>
                                        <Icon
                                            as={CloseIcon}
                                            size="md"
                                            className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
                                        />
                                    </ModalCloseButton>
                                </ModalHeader>
                                <ModalBody>
                                    <Input isDisabled={isLoading} style={{ marginBottom: 12 }}>
                                        <InputField
                                            ref={inputRef}
                                            value={editingBarcode}
                                            onChangeText={setEditingBarcode}
                                            placeholder="Enter new barcode value"
                                            style={{ height: 40, width: "100%" }}
                                        />
                                    </Input>

                                    <Input isDisabled={isLoading} style={{ marginBottom: 12 }}>
                                        <InputField
                                            ref={inputRef}
                                            value={editingItemName}
                                            onChangeText={setEditingItemName}
                                            placeholder="Enter item name"
                                            style={{ height: 40, width: "100%" }}
                                        />
                                    </Input>

                                    <Input isDisabled={isLoading} style={{ marginBottom: 12 }}>
                                        <InputField
                                            ref={inputRef}
                                            value={editingItemDescription}
                                            onChangeText={setEditingItemDescription}
                                            placeholder="Enter item description"
                                            style={{ height: 40, width: "100%" }}
                                        />
                                    </Input>

                                    <Select
                                        isDisabled={isLoading}
                                        selectedValue={editingItemGroup}
                                        onValueChange={setEditingItemGroup}
                                    >
                                        <SelectTrigger variant="outline" size="md" style={{ marginBottom: 12 }}>
                                            <SelectInput value={groupLabels[editingItemGroup] ?? "Select item group"} placeholder="Select Item Group" />
                                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                        </SelectTrigger>
                                        <SelectPortal>
                                            <SelectBackdrop />
                                            <SelectContent>
                                                <SelectDragIndicatorWrapper>
                                                    <SelectDragIndicator />
                                                </SelectDragIndicatorWrapper>
                                                <SelectItem label="Camera" value="camera" />
                                                <SelectItem label="Lighting" value="lighting" />
                                                <SelectItem label="Audio" value="audio" />
                                                <SelectItem label="Lenses" value="lenses" />
                                                <SelectItem label="Accessories" value="accessories" />
                                                <SelectItem label="Grip Equipment" value="grip" />
                                                <SelectItem label="Power Supply" value="power" />
                                                <SelectItem label="Cables" value="cables" />
                                                <SelectItem label="Miscellaneous" value="misc" />
                                                <SelectItem label="Unknown" value="unknown" />
                                            </SelectContent>
                                        </SelectPortal>
                                    </Select>

                                    <Input isDisabled={isLoading} style={{ marginBottom: 12 }}>
                                        <InputField
                                            ref={inputRef}
                                            value={editingItemLocation}
                                            onChangeText={setEditingItemLocation}
                                            placeholder="Enter item location"
                                            style={{ height: 40, width: "100%" }}
                                        />
                                    </Input>

                                    <Input isDisabled={isLoading} style={{ marginBottom: 12 }}>
                                        <InputField
                                            ref={inputRef}
                                            value={editingItemCount}
                                            onChangeText={setEditingItemCount}
                                            placeholder="Enter item count"
                                            keyboardType="numeric"
                                            style={{ height: 40, width: "100%" }}
                                        />
                                    </Input>

                                    <Input isDisabled={isLoading} style={{ marginBottom: 12 }}>
                                        <InputField
                                            ref={inputRef}
                                            value={editingItemPointsToRedeem}
                                            onChangeText={setEditingItemPointsToRedeem}
                                            placeholder="Enter points to redeem"
                                            keyboardType="numeric"
                                            style={{ height: 40, width: "100%" }}
                                        />
                                    </Input>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        variant="outline"
                                        action="secondary"
                                        onPress={() => setShowEditModal(false)}
                                    >
                                        <ButtonText>Cancel</ButtonText>
                                    </Button>
                                    <Button onPress={saveEditedBarcode} isDisabled={isLoading || editingBarcode.trim().length === 0 || editingItemName.trim().length === 0 || !hasChanges}>
                                        <ButtonText>Save</ButtonText>
                                    </Button>
                                </ModalFooter>
                            </ModalContent>
                        </Modal>
                        {/* Delete Confirmation Modal */}
                        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
                            <ModalBackdrop />
                            <ModalContent>
                                <ModalHeader>
                                    <Heading size="md">Confirm Deletion</Heading>
                                    <ModalCloseButton>
                                        <Icon as={CloseIcon} size="md" />
                                    </ModalCloseButton>
                                </ModalHeader>
                                <ModalBody>
                                    <Text size="sm">Are you sure you want to delete this item? This action cannot be undone.</Text>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="outline" action="secondary" onPress={() => setShowDeleteModal(false)}>
                                        <ButtonText>Cancel</ButtonText>
                                    </Button>
                                    <Button
                                        action="negative"
                                        onPress={() => {
                                            if (deleteItemId) handleDelete(deleteItemId);
                                            setShowDeleteModal(false);
                                        }}
                                    >
                                        <ButtonText>Delete</ButtonText>
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
                                    <ModalCloseButton>
                                        <Icon as={CloseIcon} size="md" />
                                    </ModalCloseButton>
                                </ModalHeader>
                                <ModalBody>
                                    <Text size="sm">Are you sure you want to receive all selected items?</Text>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="outline" action="secondary" onPress={() => setShowReceiveModal(false)}>
                                        <ButtonText>Cancel</ButtonText>
                                    </Button>
                                    <Button
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

                        <Modal isOpen={showDispatchModal} onClose={() => setShowDispatchModal(false)} size="md">
                            <ModalBackdrop />
                            <ModalContent>
                                <ModalHeader>
                                    <Heading size="md">Confirm Dispatch</Heading>
                                    <ModalCloseButton>
                                        <Icon as={CloseIcon} size="md" />
                                    </ModalCloseButton>
                                </ModalHeader>
                                <ModalBody>
                                    <Text size="sm">
                                        Are you sure you want to dispatch the selected items? This will deduct the dispatched quantity from the available stock. Note: Only items with sufficient stock will be dispatched.
                                    </Text>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="outline" action="secondary" onPress={() => setShowDispatchModal(false)}>
                                        <ButtonText>Cancel</ButtonText>
                                    </Button>
                                    <Button onPress={handleDispatch}>
                                        <ButtonText>Confirm</ButtonText>
                                    </Button>
                                </ModalFooter>
                            </ModalContent>
                        </Modal>
                    </ScrollView>

                    <HStack
                        style={{
                            justifyContent: "space-between",
                            paddingTop: 12,
                            borderTopWidth: 1,
                            borderColor: "gray4",
                            display: (pendingItems.length + pendingUnknownItems.length) > 0 ? "flex" : "none",
                        }}
                    >
                        <HStack space="sm" style={{ alignItems: "center" }}>
                            <Checkbox
                                value="selectAll"
                                size="sm"
                                isChecked={allSelected}
                                onChange={(isChecked) => {
                                    isChecked ? selectAll() : unselectAll();
                                }}
                            >
                                <CheckboxIndicator>
                                    <CheckboxIcon as={CheckIcon} color="white" />
                                </CheckboxIndicator>
                            </Checkbox>
                            <Text size="sm" onPress={allSelected ? unselectAll : selectAll}>
                                Select All
                            </Text>
                            <Button
                                variant="outline"
                                size="sm"
                                action="negative"
                                onPress={handleClearResults}
                                isDisabled={isLoading}
                                style={{ marginLeft: 8 }}
                            >
                                <ButtonText>Clear Results</ButtonText>
                            </Button>
                        </HStack>

                        <HStack space="sm">
                            <Button
                                onPress={() => setShowReceiveModal(true)}
                                isDisabled={selectedIds.size === 0 || isLoading}
                            >
                                <ButtonText>Receive</ButtonText>
                            </Button>
                            <Button
                                onPress={() => setShowDispatchModal(true)}
                                isDisabled={selectedIds.size === 0 || isLoading || selectedInsufficientStock}
                            >
                                <ButtonText>Dispatch</ButtonText>
                            </Button>
                        </HStack>
                    </HStack>
                </VStack>
            )}
        </ProtectedRoute>
    );
}
