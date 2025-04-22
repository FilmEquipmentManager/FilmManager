import { LinearGradient } from "expo-linear-gradient";
import { ScrollView } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { SafeAreaView } from "react-native-safe-area-context";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";
import { Package, StampIcon, Zap } from "lucide-react-native";

export default function RewardsScreen() {
	return (
		<ProtectedRoute>
			{(userData) => {
				type Redemption = {
					productId: string;
					productName: string;
					productGroup: string;
					quantity: number;
				};

				const redemptions: Redemption[] = userData?.redemptions ? (Object.values(userData.redemptions) as Redemption[]) : [];

				return (
					<LinearGradient
						colors={["#F0FDF4", "#ECFEFF"]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{ flex: 1 }}
					>
						<SafeAreaView style={{ flex: 1 }}>
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
									<Heading
										size="lg"
										style={{ color: "#166534" }}
									>
										My Rewards
									</Heading>
									<HStack
										space="xs"
										style={{
											alignItems: "center",
											marginTop: 4,
										}}
									>
										<Icon
											as={Zap}
											size="sm"
											style={{ color: "#059669" }}
										/>
										<Text
											style={{
												color: "#059669",
												fontWeight: "medium",
											}}
										>
											Available Points:{" "}{userData?.points || 0}
										</Text>
									</HStack>
								</VStack>
							</HStack>

							<ScrollView contentContainerStyle={{ padding: 16 }}>
								{redemptions.length === 0 ? (
									<VStack
										space="md"
										style={{
											alignItems: "center",
											padding: 24,
										}}
									>
										<Icon
											as={Package}
											size="xl"
											style={{ color: "#D1D5DB" }}
										/>
										<Text
											style={{
												color: "#6B7280",
												textAlign: "center",
											}}
										>
											No rewards redeemed yet. Start redeeming amazing items!
										</Text>
									</VStack>
								) : (
									<VStack space="lg">
										{redemptions.map((redemption) => (
											<Card
												key={redemption.productId}
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
													borderWidth: 1,
													borderColor: "#E5E7EB",
												}}
											>
												<HStack
													space="md"
													style={{
														alignItems: "center",
													}}
												>
													<Box
														style={{
															width: 50,
															height: 50,
															borderRadius: 8,
															backgroundColor: "#ECFDF5",
															justifyContent: "center",
															alignItems: "center",
														}}
													>
														<Icon
															as={StampIcon}
															size="md"
															style={{
																color: "#10B981",
															}}
														/>
													</Box>

													<VStack style={{ flex: 1 }}>
														<Text
															style={{
																fontSize: 16,
																fontWeight: "bold",
																color: "#111827",
															}}
														>
															{redemption.productName}
														</Text>
														<HStack
															style={{
																justifyContent: "space-between",
																marginTop: 8,
															}}
														>
															<VStack space="xs">
																<Text
																	style={{
																		color: "#4B5563",
																		fontSize: 14,
																	}}
																>
																	Group:{" "}{redemption.productGroup}
																</Text>
																<Text
																	style={{
																		color: "#4B5563",
																		fontSize: 14,
																	}}
																>
																	Quantity:{" "}{redemption.quantity}
																</Text>
															</VStack>
															<Box
																style={{
																	backgroundColor: "#ECFDF5",
																	paddingHorizontal: 12,
																	paddingVertical: 6,
																	borderRadius: 8,
																	alignSelf: "flex-start",
																}}
															>
																<Text
																	style={{
																		color: "#059669",
																		fontWeight: "bold",
																		fontSize: 14,
																	}}
																>
																	Redeemed
																</Text>
															</Box>
														</HStack>
													</VStack>
												</HStack>
											</Card>
										))}
									</VStack>
								)}
							</ScrollView>
						</SafeAreaView>
					</LinearGradient>
				);
			}}
		</ProtectedRoute>
	);
}