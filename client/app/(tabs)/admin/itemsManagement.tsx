// @ts-nocheck
import ProtectedRoute from '@/app/_wrappers/ProtectedRoute';
import React, { useState } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { LinearGradient } from "expo-linear-gradient";
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from "@/components/ui/select"
import { ChevronDownIcon, CloseIcon, Icon } from "@/components/ui/icon"
import { PencilIcon, Search, SearchIcon, SparklesIcon, Trash2Icon, WarehouseIcon } from 'lucide-react-native';
import { Modal, ModalBackdrop, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { FormControl, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control"
import { Button, ButtonText } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableData } from "@/components/ui/table";
import { Heading } from '@/components/ui/heading';
import server from "../../../networking";
import Constants from "expo-constants";
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';

interface BarcodeItem {
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
    imageUrl?: string; // Added imageUrl property
}

const ItemsManagement = () => {
    const { width, height } = useWindowDimensions();
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingItems, setPendingItems] = useState<BarcodeItem[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<BarcodeItem | null>(null);
    const [editingBarcode, setEditingBarcode] = useState("");
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
    const [isSelectOpen, setIsSelectOpen] = useState(false)
    const [isOpen, setIsOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        barcode: false,
        itemName: false,
        itemDescription: false,
        location: false,
        itemCount: false,
        pointsToRedeem: false,
    });

    const { barcodes, loading } = useData()

    const { API_KEY } = Constants.expoConfig.extra;

    const groupLabels = { all: "All Equipment", available: "Available Items", unavailable: "Unavailable Items", camera: "Camera", lighting: "Lighting", audio: "Audio", lenses: "Lenses", accessories: "Accessories", grip: "Grip Equipment", power: "Power Supply", cables: "Cables", misc: "Miscellaneous", others: "Others" };
    const editingGroupLabels = { camera: "Camera", lighting: "Lighting", audio: "Audio", lenses: "Lenses", accessories: "Accessories", grip: "Grip Equipment", power: "Power Supply", cables: "Cables", misc: "Miscellaneous", others: "Others" };

    const barcodeArray: BarcodeItem[] = barcodes ? Object.values(barcodes) : [];

    const filteredItems: BarcodeItem[] = barcodeArray.filter((barcode: BarcodeItem) => {
        const searchLower = searchQuery.toLowerCase();

        const matchesSearch =
            barcode.itemName?.toLowerCase().includes(searchLower) ||
            barcode.itemDescription?.toLowerCase().includes(searchLower) ||
            barcode.barcode?.toLowerCase().includes(searchLower);
        barcode.location?.toLowerCase().includes(searchLower);

        const matchesGroup =
            selectedGroup === 'all' ? true :
                selectedGroup === 'available' ? barcode.totalCount > 0 :
                    selectedGroup === 'unavailable' ? barcode.totalCount <= 0 :
                        barcode.group === selectedGroup;

        return matchesSearch && matchesGroup;
    });

    const handleEdit = (item: BarcodeItem) => {
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

        setShowEditModal(true);
    };

    const handleCancelKnownItem = () => {
        setEditingItem(null);
        setValidationErrors({
            barcode: false,
            itemName: false,
            itemDescription: false,
            location: false,
            itemCount: false,
            pointsToRedeem: false,
        });
        setShowEditModal(false)
    }

    const trueLength = (str) => [...str].length;

    const validateInputs = () => {
        const alphanumeric = /^[a-zA-Z0-9 ]*$/;
        const generalTextPattern = /^[\u4e00-\u9fa5\p{L}\p{N}\p{P}\p{Emoji_Presentation} ]*$/u;
        const numeric = /^[0-9]+$/;
        const locationPattern = /^[0-9-]*$/;

        return {
            barcode:
                trueLength(editingBarcode) > 100 ||
                !alphanumeric.test(editingBarcode),

            itemName:
                trueLength(editingItemName) > 100 ||
                !generalTextPattern.test(editingItemName),
    
            itemDescription:
                trueLength(editingItemDescription) > 250 ||
                !generalTextPattern.test(editingItemDescription),

            location:
                trueLength(editingItemLocation) > 20 ||
                !locationPattern.test(editingItemLocation),

            itemCount:
                trueLength(editingItemCount) > 6 ||
                !numeric.test(editingItemCount),

            pointsToRedeem:
                trueLength(editingItemPointsToRedeem) > 6 ||
                !numeric.test(editingItemPointsToRedeem),
        };
    };

    const handleValidation = () => {
        const errors = validateInputs();
        setValidationErrors(errors);
        return !Object.values(errors).some(Boolean);
    };

    const saveEditedBarcode = async () => {
        if (!editingItem || !handleValidation()) return;
        setIsLoading(true);

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

        try {
            await server.put('/api/barcodes', [{
                id: editingItem.id,
                operation: 'edit',
                barcode: editingBarcode.trim(),
                group: editingItemGroup.trim(),
                location: editingItemLocation.trim(),
                pointsToRedeem: parseInt(editingItemPointsToRedeem) || 0,
                itemName: editingItemName.trim(),
                itemDescription: editingItemDescription.trim(),
                count: parseInt(editingItemCount),
            }]);
        } catch (error) {
            console.error("Edit Error:", error);
            if (
                error.response &&
                error.response.data &&
                typeof error.response.data.error === "string" &&
                error.response.data.error.startsWith("UERROR: ")
            ) {
                const cleanedMessage = error.response.data.error.replace("UERROR: ", "");
                showToast("Edit Error", cleanedMessage);
            } else {
                showToast("Edit Error", "Failed to update barcode. Please try again.");
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
            await server.delete('/api/barcodes', {
                data: [id],
                headers: { apiKey: API_KEY }
            });
            setPendingItems((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            console.error("Error deleting barcode:", error);
            showToast("Delete failed", "Failed to delete barcode. Please try again.");
        }
        setIsLoading(false);
        setShowEditModal(false);
    }

    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const groupedItems: Record<string, BarcodeItem[]> = filteredItems.reduce((groups, item) => {
        const group = item.group?.toLowerCase() || "unknown";
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
    }, {});

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

    const isMediumLaptop = width < 1400;
    const isSmallLaptop = width < 1024;
    const isShortScreen = height < 750;
    const isMobileScreen = width < 680;
    const isTinyScreen = width < 375;
    const isLaptop = width < 1270

    const allColumns = [
        { key: "image", label: "Image", flex: 1, maxWidth: 48, visible: !isLaptop },
        { key: "barcode", label: "Barcode", flex: 1.5, maxWidth: 120, visible: true },
        { key: "itemName", label: "Name", flex: 2, maxWidth: 100, visible: true },
        { key: "itemDescription", label: "Description", flex: 2, maxWidth: 100, visible: !isSmallLaptop },
        { key: "location", label: "Location", flex: 1, maxWidth: 80, visible: !isSmallLaptop },
        { key: "stock", label: "Stock", flex: 0.5, maxWidth: 20, visible: !isMobileScreen },
        { key: "points", label: "Points", flex: 0.5, maxWidth: 20, visible: !isMobileScreen },
        { key: "actions", label: "Actions", flex: 0.5, maxWidth: 80, visible: true },
    ];

    const columns = allColumns.filter(col => col.visible);

    return (
        <ProtectedRoute showAuth={true}>
            <LinearGradient
                colors={isMobileScreen ? ['#00FFDD', '#1B9CFF'] : ['#1B9CFF', '#00FFDD']}
                start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <VStack style={{ padding: isMobileScreen ? 4 : 8, width: "90%", alignSelf: "center", gap: 10, marginTop: isMobileScreen ? 60 : 20, marginBottom: 14 }} space="xl">
                    {/* Filter and Search Row */}
                    <HStack space="xl" style={{ alignItems: "center", justifyContent: isMobileScreen ? "space-between" : "flex-start", marginBottom: 20, width: "100%" }}>
                        {/* Category Dropdown */}
                        <HStack style={{ marginRight: isMobileScreen ? 0 : 12 }}>
                            <Select open={isOpen} onOpenChange={setIsOpen} onValueChange={(value) => { setSelectedGroup(value); setIsOpen(false); }}>
                                <SelectTrigger
                                    variant="outline"
                                    size={isMobileScreen ? "sm" : "md"}
                                    style={{ backgroundColor: "white" }}
                                >
                                    {!isMobileScreen && (
                                        <SelectInput placeholder="Category" style={{ color: "black" }} />
                                    )}
                                    {isMobileScreen && (
                                        <Text style={{ color: "black", fontSize: 14, padding: 10 }}>Filter</Text>
                                    )}
                                    <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                </SelectTrigger>
                                <SelectPortal>
                                    <SelectBackdrop />
                                    <SelectContent style={{ backgroundColor: "white" }}>
                                        <SelectDragIndicatorWrapper>
                                            <SelectDragIndicator />
                                        </SelectDragIndicatorWrapper>
                                        {Object.entries(groupLabels).map(([key, label]) => (
                                            <SelectItem
                                                key={key}
                                                label={label}
                                                value={key}
                                                style={{ backgroundColor: "white" }}
                                            />
                                        ))}
                                    </SelectContent>
                                </SelectPortal>
                            </Select>
                        </HStack>

                        {/* Search Input */}
                        <Input style={{ backgroundColor: "white" }} size={isShortScreen ? "sm" : "md"}>
                            {!isShortScreen && (
                                <InputField
                                    placeholder="Find an item..."
                                    value={searchQuery}
                                    onChangeText={(text) => setSearchQuery(text)}
                                    style={{ color: "black" }}
                                />
                            )}
                            {isShortScreen && (
                                <InputField
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChangeText={(text) => setSearchQuery(text)}
                                    style={{ color: "black" }}
                                />
                            )}
                            <InputSlot style={{ paddingRight: 4 }}>
                                <Icon as={SearchIcon} size="md" style={{ color: "gray", display: isMobileScreen ? "none" : "flex" }} />
                            </InputSlot>
                        </Input>
                    </HStack>

                    {filteredItems.length === 0 && (
                        <VStack
                            style={{
                                backgroundColor: "white",
                                borderRadius: 24,
                                padding: isMobileScreen ? 16 : 24,
                                marginTop: 10,
                                marginBottom: 10,
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 6,
                                elevation: 2,
                                minHeight: 200
                            }}
                        >
                            <WarehouseIcon size={48} color="#4f46e5" style={{ marginBottom: 16 }} />
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontWeight: "700",
                                    color: "#4f46e5",
                                    textAlign: "center",
                                    marginBottom: 8
                                }}
                            >
                                No items found
                            </Text>

                            <Text
                                style={{
                                    fontSize: 16,
                                    color: "#6b7280",
                                    textAlign: "center"
                                }}
                            >
                                Try adjusting your search criteria or category filter
                            </Text>
                        </VStack>
                    )}

                    {filteredItems.length > 0 && (
                        <ScrollView>
                            <VStack space="2xl" style={{ flex: 1, paddingRight: isMobileScreen ? 0 : 20 }}>
                                {Object.entries(groupedItems).map(([groupKey, items]) => (
                                    <VStack
                                        key={groupKey}
                                        space="lg"
                                        style={{
                                            backgroundColor: "white",
                                            borderRadius: 24,
                                            padding: isMobileScreen ? 10 : 16,
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.05,
                                            shadowRadius: 6,
                                            elevation: 2
                                        }}
                                    >
                                        {/* Group Title */}
                                        <HStack style={{
                                            alignItems: "center",
                                            gap: 6,
                                            padding: 12,
                                            backgroundColor: "#eef2ff",
                                            borderRadius: 16
                                        }}>
                                            <Text style={{
                                                fontSize: 20,
                                                fontWeight: "900",
                                                color: "#4f46e5",
                                                letterSpacing: -0.5,
                                                textTransform: "uppercase"
                                            }}>
                                                {groupLabels[groupKey] || "Other"}
                                            </Text>
                                        </HStack>

                                        {/* Table Structure */}
                                        <Table style={{ width: "100%" }}>
                                            <TableHeader style={{
                                                backgroundColor: "#f8fafc",
                                                borderRadius: 12,
                                                padding: 12,
                                                borderBottomWidth: 0,
                                            }}>
                                                <TableRow style={{
                                                    shadowColor: "transparent",
                                                    borderBottomWidth: 0,
                                                    backgroundColor: "transparent",
                                                }}>
                                                    {columns
                                                        .filter(col => col.visible)
                                                        .map((col, index, visibleCols) => {
                                                            const isFirstCol = index === 0;
                                                            const isLastCol = index === visibleCols.length - 1;

                                                            return (
                                                                <TableHead
                                                                    key={col.key}
                                                                    style={{
                                                                        width: col.maxWidth,
                                                                        paddingVertical: isTinyScreen ? 8 : isMobileScreen ? 10 : 14,
                                                                        paddingHorizontal: isTinyScreen ? 6 : 10,
                                                                        backgroundColor: "#4f46e5",
                                                                        borderTopLeftRadius: isFirstCol ? 12 : 0,
                                                                        borderTopRightRadius: isLastCol ? 12 : 0,
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            color: "white",
                                                                            fontWeight: "800",
                                                                            letterSpacing: 0.5,
                                                                            textTransform: "uppercase",
                                                                            fontSize: isTinyScreen ? 10 : isMobileScreen ? 12 : 14
                                                                        }}
                                                                    >
                                                                        {col.label}
                                                                    </Text>
                                                                </TableHead>
                                                            );
                                                        })}
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {items.map(item => (
                                                    <TableRow key={item.id} style={{ backgroundColor: "transparent" }}>
                                                        {columns.map(col => {
                                                            // common style object for each cell
                                                            const cellStyle = { flex: col.flex, minWidth: col.maxWidth, justifyContent: col.key === "image" || col.key === "actions" ? "center" : undefined };

                                                            switch (col.key) {
                                                                case "image":
                                                                    return (
                                                                        <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center" }}>
                                                                            <Image
                                                                                style={{ width: isTinyScreen ? 36 : 48, height: isTinyScreen ? 36 : 48, borderRadius: 8 }}
                                                                                source={{ uri: item.imageUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVNer1ZryNxWVXojlY9Hoyy1-4DVNAmn7lrg&s' }}
                                                                                alt="item image"
                                                                            />
                                                                        </TableData>
                                                                    );
                                                                case "stock":
                                                                    return (
                                                                        <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center" }}>
                                                                            <Badge
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        item.totalCount <= 10
                                                                                            ? "#fef2f2"
                                                                                            : item.totalCount <= 100
                                                                                                ? "#fefce8"
                                                                                                : "#f0fdf4",
                                                                                    borderRadius: 10,
                                                                                    paddingVertical: isTinyScreen ? 2 : 4,
                                                                                    paddingHorizontal: isTinyScreen ? 4 : 8,
                                                                                    flexDirection: "row",
                                                                                    alignItems: "center",
                                                                                    gap: isTinyScreen ? 4 : 6,
                                                                                    width: "100%"
                                                                                }}
                                                                            >
                                                                                <Box
                                                                                    style={{
                                                                                        width: isTinyScreen ? 6 : 8,
                                                                                        height: isTinyScreen ? 6 : 8,
                                                                                        borderRadius: 4,
                                                                                        backgroundColor:
                                                                                            item.totalCount <= 10
                                                                                                ? "#dc2626"
                                                                                                : item.totalCount <= 100
                                                                                                    ? "#eab308"
                                                                                                    : "#16a34a"
                                                                                    }}
                                                                                />
                                                                                <Text
                                                                                    style={{
                                                                                        fontWeight: "700",
                                                                                        fontSize: isTinyScreen ? 10 : 12,
                                                                                        color:
                                                                                            item.totalCount <= 10
                                                                                                ? "#991b1b"
                                                                                                : item.totalCount <= 100
                                                                                                    ? "#854d0e"
                                                                                                    : "#166534"
                                                                                    }}
                                                                                >
                                                                                    {item.totalCount}
                                                                                </Text>
                                                                            </Badge>
                                                                        </TableData>
                                                                    );
                                                                case "points":
                                                                    return (
                                                                        <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center" }}>
                                                                            <Badge
                                                                                style={{
                                                                                    backgroundColor: "rgba(234, 179, 8, 0.1)",
                                                                                    borderRadius: 10,
                                                                                    paddingVertical: 4,
                                                                                    paddingHorizontal: 8,
                                                                                    flexDirection: "row",
                                                                                    alignItems: "center",
                                                                                    gap: 6,
                                                                                    width: "100%"
                                                                                }}
                                                                            >
                                                                                <SparklesIcon size={isTinyScreen ? 12 : 14} color="#eab308" />
                                                                                <Text
                                                                                    style={{
                                                                                        fontWeight: "700",
                                                                                        fontSize: isTinyScreen ? 10 : 12,
                                                                                        color: "#854d0e"
                                                                                    }}
                                                                                >
                                                                                    {item.pointsToRedeem}
                                                                                </Text>
                                                                            </Badge>
                                                                        </TableData>
                                                                    );
                                                                case "actions":
                                                                    return (
                                                                        <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center" }}>
                                                                            <HStack space="md" style={{ width: isTinyScreen ? 44 : 60 }}>
                                                                                <Button
                                                                                    size="sm"
                                                                                    action="secondary"
                                                                                    onPress={() => handleEdit(item)}
                                                                                    isDisabled={isLoading}
                                                                                    style={{ padding: 4, backgroundColor: "transparent" }}
                                                                                >
                                                                                    <PencilIcon size={isTinyScreen ? 12 : 16} color="#4f46e5" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    action="secondary"
                                                                                    onPress={() => {
                                                                                        setDeleteItemId(item.id);
                                                                                        setShowDeleteModal(true);
                                                                                    }}
                                                                                    isDisabled={isLoading}
                                                                                    style={{ padding: 4, backgroundColor: "transparent", color: "red" }}
                                                                                >
                                                                                    <Trash2Icon size={isTinyScreen ? 12 : 16} color="#dc2626" />
                                                                                </Button>
                                                                            </HStack>
                                                                        </TableData>
                                                                    );
                                                                default:
                                                                    const text = item[col.key as keyof BarcodeItem] ?? "";
                                                                    return (
                                                                        <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center", maxWidth: col.maxWidth }}>
                                                                            <Text
                                                                                style={{
                                                                                    color: "black",
                                                                                    fontSize: isTinyScreen ? 10 : isMobileScreen ? 12 : 14,
                                                                                    maxWidth: col.maxWidth,
                                                                                    flexWrap: "wrap",
                                                                                    wordBreak: 'break-word',
                                                                                }}
                                                                            >
                                                                                {text}
                                                                            </Text>
                                                                        </TableData>
                                                                    );
                                                            }
                                                        })}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </VStack>
                                ))}
                            </VStack>
                        </ScrollView>
                    )}

                    {/* Delete Confirmation Modal */}
                    <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading>Confirm Deletion</Heading>
                                <ModalCloseButton>
                                    <Icon as={CloseIcon} />
                                </ModalCloseButton>
                            </ModalHeader>
                            <ModalBody>
                                <Text>Are you sure you want to delete this item? This action cannot be undone.</Text>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="outline" style={{ marginRight: 3 }} onPress={() => setShowDeleteModal(false)}>
                                    <ButtonText>Cancel</ButtonText>
                                </Button>
                                <Button
                                    style={{ backgroundColor: "red" }}
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

                    {/* Known Items Editing Modal */}
                    <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading size="md" className="text-typography-950">Edit Items</Heading>
                                <ModalCloseButton style={{ backgroundColor: "transparent" }}>
                                    <Icon as={CloseIcon} size="md" className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900" />
                                </ModalCloseButton>
                            </ModalHeader>

                            <ModalBody>
                                {/* Barcode */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.barcode}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Barcode</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField value={editingBarcode} onChangeText={setEditingBarcode} placeholder="Enter Item's Barcode" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.barcode && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red" }}>* Barcode must be alphanumeric and ≤ 100 characters.</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Name */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemName}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Name</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField value={editingItemName} onChangeText={setEditingItemName} placeholder="Enter Item Name" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.itemName && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red" }}>* Item Name must be alphanumeric and ≤ 100 characters.</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Description */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemDescription}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Description</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField value={editingItemDescription} onChangeText={setEditingItemDescription} placeholder="Enter Item Description" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.itemDescription && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red" }}>* Description must be alphanumeric and ≤ 250 characters.</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Group (no validation needed) */}
                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Group</FormControlLabelText>
                                    </FormControlLabel>
                                    <Select
                                        isDisabled={isLoading}
                                        selectedValue={editingItemGroup}
                                        onValueChange={(value) => {
                                            setEditingItemGroup(value);
                                            setIsSelectOpen(false);
                                        }}
                                        onOpen={() => setIsSelectOpen(true)}
                                        onClose={() => setIsSelectOpen(false)}
                                    >
                                        <SelectTrigger variant="outline" size="md" style={{ height: 40, alignItems: "center", justifyContent: isMobileScreen ? "flex-start" : "space-between" }}>
                                            <SelectInput value={editingGroupLabels[editingItemGroup]} placeholder="Select Item Group" />
                                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                        </SelectTrigger>
                                        <SelectPortal>
                                            <SelectBackdrop />
                                            <SelectContent>
                                                <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                                {Object.entries(editingGroupLabels).map(([value, label]) => (
                                                    <SelectItem key={value} label={label} value={value} />
                                                ))}
                                            </SelectContent>
                                        </SelectPortal>
                                    </Select>
                                </FormControl>

                                {/* Location */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.location}>
                                    <FormControlLabel>
                                        <FormControlLabelText>Location</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField value={editingItemLocation} onChangeText={setEditingItemLocation} placeholder="Enter Item Warehouse Location" style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.location && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red" }}>* Location can only include numbers and dashes, ≤ 20 characters.</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                <HStack
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 12,
                                        marginTop: 10,
                                    }}
                                >
                                    {/* Item Count */}
                                    <VStack style={{ width: "48%" }}>
                                        <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemCount}>
                                            <FormControlLabel>
                                                <FormControlLabelText>Item Count</FormControlLabelText>
                                            </FormControlLabel>
                                            <Input isDisabled={isLoading}>
                                                <InputField
                                                    value={editingItemCount}
                                                    onChangeText={setEditingItemCount}
                                                    placeholder="Enter Item Stock Count"
                                                    keyboardType="numeric"
                                                    style={{ height: 40, width: "100%" }}
                                                />
                                            </Input>
                                            {validationErrors.itemCount && (
                                                <FormControlHelper>
                                                    <FormControlHelperText style={{ color: "red" }}>
                                                        * Count must be numeric and ≤ 6 digits.
                                                    </FormControlHelperText>
                                                </FormControlHelper>
                                            )}
                                        </FormControl>
                                    </VStack>

                                    {/* Points to Redeem */}
                                    <VStack style={{ width: "48%" }}>
                                        <FormControl isInvalid={validationErrors.pointsToRedeem}>
                                            <FormControlLabel>
                                                <FormControlLabelText>Points to Redeem</FormControlLabelText>
                                            </FormControlLabel>
                                            <Input isDisabled={isLoading}>
                                                <InputField
                                                    value={editingItemPointsToRedeem}
                                                    onChangeText={setEditingItemPointsToRedeem}
                                                    placeholder="Enter Points To Redeem For Item"
                                                    keyboardType="numeric"
                                                    style={{ height: 40, width: "100%" }}
                                                />
                                            </Input>
                                            {validationErrors.pointsToRedeem && (
                                                <FormControlHelper>
                                                    <FormControlHelperText style={{ color: "red" }}>
                                                        * Points must be numeric and ≤ 6 digits.
                                                    </FormControlHelperText>
                                                </FormControlHelper>
                                            )}
                                        </FormControl>
                                    </VStack>
                                </HStack>
                            </ModalBody>

                            <ModalFooter>
                                <HStack space="md" style={{ width: "100%" }}>
                                    <Button
                                        variant="outline"
                                        style={{ flex: 1, borderColor: "#6B7280" }}
                                        onPress={handleCancelKnownItem}
                                        isDisabled={isLoading}
                                    >
                                        <Text style={{ color: "#6B7280" }}>Cancel</Text>
                                    </Button>
                                    <Button
                                        style={{ flex: 1, backgroundColor: "#1B9CFF" }}
                                        onPress={saveEditedBarcode}
                                        isDisabled={isLoading}
                                    >
                                        <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
                                    </Button>
                                </HStack>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </VStack>
            </LinearGradient>
        </ProtectedRoute>
    );
};

export default ItemsManagement;
