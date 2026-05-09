"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  FlatList,
  TextInput,
  Modal,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RouteProp } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useCart } from "../../src/context/CartContext"
import { useAuth } from "../../src/context/AuthContext"
import apiService from "../services/apiService"
import { ProductImage } from '../components/ProductImage'

// Minimal location dataset for cascade selection
const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  "TP. Hồ Chí Minh": {
    "Quận 1": ["Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Ông Lãnh"],
    "Quận 3": ["Phường 6", "Phường 7", "Phường Võ Thị Sáu"],
  },
  "Hà Nội": {
    "Quận Hoàn Kiếm": ["Phường Hàng Trống", "Phường Hàng Bài", "Phường Tràng Tiền"],
    "Quận Ba Đình": ["Phường Điện Biên", "Phường Quán Thánh", "Phường Ngọc Hà"],
  },
}

// Define your navigation types
type RootStackParamList = {
  Order: {
    product?: any
    selectedSize?: string
    quantity?: number
    totalPrice?: number
    fromCart?: boolean
  }
  Payment: {
    product?: any
    selectedSize?: string
    quantity?: number
    deliveryMethod: string
    totalPrice: number
    fromCart?: boolean
    address: string
    note: string
  }
}

type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, "Order">
type OrderScreenRouteProp = RouteProp<RootStackParamList, "Order">

export default function OrderScreen() {
  const navigation = useNavigation<OrderScreenNavigationProp>()
  const route = useRoute<OrderScreenRouteProp>()
  const { product, selectedSize, quantity: initialQuantity, fromCart } = route.params || {}
  const { cartItems, getCartTotal } = useCart()
  const { user } = useAuth()

  const [quantity, setQuantity] = useState<number>(initialQuantity || 1)
  const [deliveryMethod, setDeliveryMethod] = useState<"deliver" | "pickup">("deliver")
  
  type Promotion = { id: string; label: string; threshold: number; type: 'percent' | 'amount'; value: number }
  const PROMOTIONS: Promotion[] = [
    { id: 'none', label: 'Không áp dụng', threshold: 0, type: 'amount', value: 0 },
    { id: '30k', label: 'Đơn từ 30.000₫: giảm 3.000₫', threshold: 30000, type: 'amount', value: 3000 },
    { id: '100k', label: 'Đơn từ 100.000₫: giảm 10%', threshold: 100000, type: 'percent', value: 10 },
  ]
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('none')
  const [eligiblePromotions, setEligiblePromotions] = useState<string[]>(['none'])
  const [address, setAddress] = useState<string>(user?.address || "")
  const [addressModalVisible, setAddressModalVisible] = useState(false)
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [tempAddress, setTempAddress] = useState(address)
  const [tempProvince, setTempProvince] = useState<string>("")
  const [tempDistrict, setTempDistrict] = useState<string>("")
  const [tempWard, setTempWard] = useState<string>("")
  const [tempStreet, setTempStreet] = useState<string>("")
  const [selectModalVisible, setSelectModalVisible] = useState(false)
  const [selectType, setSelectType] = useState<"province" | "district" | "ward">("province")
  const [selectOptions, setSelectOptions] = useState<Array<{ code: string; name: string }>>([])
  const [selectLoading, setSelectLoading] = useState(false)
  const [tempProvinceCode, setTempProvinceCode] = useState<string>("")
  const [tempDistrictCode, setTempDistrictCode] = useState<string>("")
  const [note, setNote] = useState("")
  const [tempNote, setTempNote] = useState(note)

  useEffect(() => {
    if (user?.address && user.address.trim() !== "" && user.address !== address) {
      setAddress(user.address)
      setTempAddress(user.address)
    }
  }, [user?.address])

  const handleBack = () => {
    navigation.goBack()
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
  }

  const handleEditAddress = () => {
    setTempAddress(address)
    if (address && address.includes(",")) {
      const parts = address.split(",").map(p => p.trim())
      // Parse: street, ward, district, province
      if (parts.length >= 4) {
        setTempStreet(parts[0] || "")
        setTempWard(parts[1] || "")
        setTempDistrict(parts[2] || "")
        setTempProvince(parts[3] || "")
      } else if (parts.length === 3) {
        setTempStreet("")
        setTempWard(parts[0] || "")
        setTempDistrict(parts[1] || "")
        setTempProvince(parts[2] || "")
      }
    } else {
      setTempStreet("")
      setTempWard("")
      setTempDistrict("")
      setTempProvince("")
    }
    setAddressModalVisible(true)
  }

  const openSelect = async (type: "province" | "district" | "ward") => {
    setSelectType(type)
    setSelectLoading(true)
    try {
      if (type === "province") {
        const provinces = await apiService.getProvinces()
        setSelectOptions(provinces)
      } else if (type === "district") {
        let provinceCode = tempProvinceCode
        if (!provinceCode && tempProvince) {
          const provinces = await apiService.getProvinces()
          const found = provinces.find(p => p.name === tempProvince)
          if (found) {
            provinceCode = found.code
            setTempProvinceCode(found.code)
          }
        }
        const districts = provinceCode ? await apiService.getDistricts(provinceCode) : []
        setSelectOptions(districts)
      } else {
        let districtCode = tempDistrictCode
        if (!districtCode && tempDistrict) {
          let provinceCode = tempProvinceCode
          if (!provinceCode && tempProvince) {
            const provinces = await apiService.getProvinces()
            const foundP = provinces.find(p => p.name === tempProvince)
            if (foundP) {
              provinceCode = foundP.code
              setTempProvinceCode(foundP.code)
            }
          }
          if (provinceCode) {
            const districts = await apiService.getDistricts(provinceCode)
            const foundD = districts.find(d => d.name === tempDistrict)
            if (foundD) {
              districtCode = foundD.code
              setTempDistrictCode(foundD.code)
            }
          }
        }
        const wards = districtCode ? await apiService.getWards(districtCode) : []
        setSelectOptions(wards)
      }
      setSelectModalVisible(true)
    } catch (e) {
      if (type === "province") {
        setSelectOptions(Object.keys(LOCATION_DATA).map(name => ({ code: name, name })))
      } else if (type === "district") {
        const names = tempProvince && LOCATION_DATA[tempProvince] ? Object.keys(LOCATION_DATA[tempProvince]) : []
        setSelectOptions(names.map(name => ({ code: name, name })))
      } else {
        const names = tempProvince && tempDistrict && LOCATION_DATA[tempProvince] && LOCATION_DATA[tempProvince][tempDistrict]
          ? LOCATION_DATA[tempProvince][tempDistrict]
          : []
        setSelectOptions(names.map(name => ({ code: name, name })))
      }
      setSelectModalVisible(true)
    } finally {
      setSelectLoading(false)
    }
  }

  const handleAddNote = () => {
    setTempNote(note)
    setNoteModalVisible(true)
  }

  const handlePayment = () => {
    if (deliveryMethod === "deliver" && (!address || address.trim() === "")) {
      Alert.alert("Thiếu địa chỉ", "Vui lòng nhập địa chỉ giao hàng để tiếp tục thanh toán.")
      return
    }
    
    try {
      if (fromCart) {
        navigation.navigate("Payment", {
          deliveryMethod,
          totalPrice: calculateTotal(),
          fromCart: true,
          address: address,
          note,
        })
      } else if (product) {
        const productToSend = {
          ...product,
          image: typeof product.image === "string" ? product.image : 
                  product.image && product.image.toString ? product.image.toString() : "",
        }
        navigation.navigate("Payment", {
          product: productToSend,
          selectedSize,
          quantity,
          deliveryMethod,
          totalPrice: calculateTotal(),
          address: address,
          note,
        })
      } else {
        throw new Error("Missing product data")
      }
    } catch (error) {
      console.error("Payment navigation error", error)
      Alert.alert("Lỗi", "Không thể tiếp tục thanh toán. Vui lòng thử lại.")
    }
  }

  const calculateSubtotal = (): number => {
    if (fromCart) {
      return getCartTotal()
    }
    return (product?.price || 0) * quantity
  }

  useEffect(() => {
    const subtotal = calculateSubtotal()
    const eligible = PROMOTIONS.filter(p => subtotal >= p.threshold).map(p => p.id)
    if (!eligible.includes('none')) eligible.unshift('none')
    setEligiblePromotions(eligible)
    const bestId = eligible[eligible.length - 1]
    setSelectedPromotionId(bestId)
  }, [cartItems, quantity, product])

  const calculateDeliveryFee = (): number => {
    return deliveryMethod === "deliver" ? 20000 : 0
  }

  const calculateDiscount = (): number => {
    const promo = PROMOTIONS.find(p => p.id === selectedPromotionId)
    if (!promo) return 0
    if (promo.type === 'amount') return promo.value
    return Math.floor((calculateSubtotal() * promo.value) / 100)
  }

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateDeliveryFee() - calculateDiscount()
  }

  const renderCartItems = () => {
    if (!fromCart || !cartItems || cartItems.length === 0) return null

    return (
      <View style={styles.cartItemsContainer}>
        <Text style={styles.sectionTitle}>Sản phẩm trong giỏ hàng</Text>
        <FlatList
          data={cartItems}
          renderItem={({ item }) => (
            <View style={styles.cartItemSmall}>
              <ProductImage image={item.product.image} style={styles.cartItemImage} />
              <View style={styles.cartItemDetails}>
                <Text style={styles.cartItemName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.cartItemSize}>Kích cỡ: {item.size}</Text>
                <View style={styles.cartItemFooter}>
                  <Text style={styles.cartItemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.cartItemPrice}>
                    {(item.product.price * item.quantity).toLocaleString("vi-VN")} VNĐ
                  </Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item, index) => `${item.product.id || index}-${item.size}-${index}`}
          scrollEnabled={false}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Delivery Options */}
        <View style={styles.deliveryOptions}>
          <TouchableOpacity
            style={[styles.deliveryOption, deliveryMethod === "deliver" && styles.activeDeliveryOption]}
            onPress={() => setDeliveryMethod("deliver")}
          >
            <Text style={[styles.deliveryOptionText, deliveryMethod === "deliver" && styles.activeDeliveryOptionText]}>
              Giao hàng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deliveryOption, deliveryMethod === "pickup" && styles.activeDeliveryOption]}
            onPress={() => setDeliveryMethod("pickup")}
          >
            <Text style={[styles.deliveryOptionText, deliveryMethod === "pickup" && styles.activeDeliveryOptionText]}>
              Tự lấy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address Section */}
        {deliveryMethod === "deliver" && (
          <View style={styles.addressContainer}>
            <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
            <Text style={styles.addressText}>
              Tên người nhận: {user?.firstName || ""} {user?.lastName || ""}{user?.phone ? ` - ${user.phone}` : ""}
            </Text>
            <Text style={styles.addressDetails}>Địa chỉ người nhận : {address}</Text>
            <View style={styles.addressActions}>
              <TouchableOpacity style={styles.addressAction} onPress={handleEditAddress}>
                <Ionicons name="create-outline" size={16} color="#666" />
                <Text style={styles.addressActionText}>Sửa địa chỉ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addressAction} onPress={handleAddNote}>
                <Ionicons name="document-text-outline" size={16} color="#666" />
                <Text style={styles.addressActionText}>Thêm ghi chú</Text>
              </TouchableOpacity>
            </View>
            {note ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: '#C87D55' }}>Ghi chú: {note}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Order Items */}
        {fromCart ? (
          renderCartItems()
        ) : product ? (
          <View style={styles.orderItemContainer}>
            <ProductImage image={product?.image} style={styles.productImage} />
            <View style={styles.orderItemDetails}>
              <View>
                <Text style={styles.productName}>{product?.name}</Text>
                <Text style={styles.productDescription}>{product?.description}</Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
                  <Ionicons name="remove" size={18} color="#C87D55" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
                  <Ionicons name="add" size={18} color="#C87D55" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Discount Section */}
        <View style={styles.discountContainer}>
          <View style={styles.discountInfo}>
            <Ionicons name="pricetag-outline" size={20} color="#FF6B6B" />
            <Text style={styles.discountText}>
              {selectedPromotionId !== 'none' ?
                `Đã áp dụng: ${PROMOTIONS.find(p => p.id === selectedPromotionId)?.label}` :
                'Không có khuyến mãi khả dụng'}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentSummary}>
          <Text style={styles.summaryTitle}>Tổng kết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{calculateSubtotal().toLocaleString("vi-VN")} VNĐ</Text>
          </View>
          {deliveryMethod === "deliver" && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng</Text>
              <Text style={styles.summaryValue}>{calculateDeliveryFee().toLocaleString("vi-VN")} VNĐ</Text>
            </View>
          )}
          {selectedPromotionId !== 'none' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={styles.summaryValue}>-{calculateDiscount().toLocaleString("vi-VN")} VNĐ</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{calculateTotal().toLocaleString("vi-VN")} VNĐ</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethod}>
          <View style={styles.paymentMethodHeader}>
            <Ionicons name="wallet-outline" size={20} color="#666" />
            <Text style={styles.paymentMethodText}>E-Wallet/Cash</Text>
            <Text style={styles.paymentAmount}>{calculateTotal().toLocaleString("vi-VN")} VNĐ</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </View>

        {/* Order Button */}
        <TouchableOpacity style={styles.orderButton} onPress={handlePayment}>
          <Text style={styles.orderButtonText}>Tiếp tục thanh toán</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for editing address */}
      <Modal
        visible={addressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sửa địa chỉ giao hàng</Text>
            
            <Text style={styles.modalFieldLabel}>Số nhà/Đường</Text>
            <TextInput
              style={styles.modalInput}
              value={tempStreet}
              onChangeText={setTempStreet}
              placeholder="Nhập số nhà, tên đường"
            />
            
            <Text style={styles.modalFieldLabel}>Tỉnh/Thành phố</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => openSelect("province")}> 
              <Text style={tempProvince ? styles.selectValue : styles.selectPlaceholder}>
                {tempProvince || "Chọn Tỉnh/Thành phố"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>

            <Text style={styles.modalFieldLabel}>Quận/Huyện</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => openSelect("district")}
              disabled={!tempProvince}
            >
              <Text style={tempDistrict ? styles.selectValue : styles.selectPlaceholder}>
                {tempDistrict || (tempProvince ? "Chọn Quận/Huyện" : "Chọn Tỉnh/Thành phố trước")}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>

            <Text style={styles.modalFieldLabel}>Phường/Xã</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => openSelect("ward")}
              disabled={!tempDistrict}
            >
              <Text style={tempWard ? styles.selectValue : styles.selectPlaceholder}>
                {tempWard || (tempDistrict ? "Chọn Phường/Xã" : "Chọn Quận/Huyện trước")}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
            
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.modalButton}>
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const composed = [tempStreet, tempWard, tempDistrict, tempProvince]
                    .map(s => s && s.trim())
                    .filter(Boolean)
                    .join(", ")
                  setAddress(composed)
                  setAddressModalVisible(false);
                }}
                style={[styles.modalButton, { backgroundColor: "#C87D55" }]}
              >
                <Text style={{ color: "#fff" }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for adding note */}
      <Modal
        visible={noteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm ghi chú cho đơn hàng</Text>
            <TextInput
              style={styles.modalInput}
              value={tempNote}
              onChangeText={setTempNote}
              placeholder="Nhập ghi chú"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)} style={styles.modalButton}>
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setNote(tempNote);
                  setNoteModalVisible(false);
                }}
                style={[styles.modalButton, { backgroundColor: "#C87D55" }]}
              >
                <Text style={{ color: "#fff" }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Select Modal for Province/District/Ward */}
      <Modal
        visible={selectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectType === 'province' ? 'Chọn Tỉnh/Thành phố' : selectType === 'district' ? 'Chọn Quận/Huyện' : 'Chọn Phường/Xã'}
            </Text>
            <FlatList
              data={selectOptions}
              keyExtractor={(item, index) => `${item.code || item.name}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ paddingVertical: 10 }}
                  onPress={() => {
                    if (selectType === 'province') {
                      setTempProvince(item.name)
                      setTempProvinceCode(item.code)
                      setTempDistrict("")
                      setTempDistrictCode("")
                      setTempWard("")
                    } else if (selectType === 'district') {
                      setTempDistrict(item.name)
                      setTempDistrictCode(item.code)
                      setTempWard("")
                    } else {
                      setTempWard(item.name)
                    }
                    setSelectModalVisible(false)
                  }}
                >
                  <Text style={{ fontSize: 15, color: '#333' }}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setSelectModalVisible(false)} style={styles.modalButton}>
                <Text>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  deliveryOptions: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#F5F5F5",
  },
  deliveryOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  activeDeliveryOption: {
    backgroundColor: "#C87D55",
  },
  deliveryOptionText: {
    fontWeight: "600",
    color: "#666",
  },
  activeDeliveryOptionText: {
    color: "white",
  },
  addressContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 5,
  },
  addressDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  addressActions: {
    flexDirection: "row",
    marginTop: 5,
  },
  addressAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10,
  },
  addressActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  orderItemContainer: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C87D55",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 10,
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  discountInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  paymentSummary: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C87D55",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
    marginRight: 15,
  },
  paymentAmount: {
    fontSize: 14,
    color: "#666",
  },
  orderButton: {
    backgroundColor: "#C87D55",
    margin: 15,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  orderButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cartItemsContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cartItemSmall: {
    flexDirection: "row",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "space-between",
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  cartItemSize: {
    fontSize: 12,
    color: "#666",
  },
  cartItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartItemQuantity: {
    fontSize: 12,
    color: "#666",
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#C87D55",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "85%",
    maxHeight: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalFieldLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    padding: 10,
    minHeight: 40,
    marginBottom: 8,
    fontSize: 15,
    color: "#333",
  },
  selectInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 40,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectPlaceholder: {
    fontSize: 15,
    color: "#999",
  },
  selectValue: {
    fontSize: 15,
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
    backgroundColor: "#f0f0f0",
  },
})