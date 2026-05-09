"use client"

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config/constants';
import apiService from '../services/apiService';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

export default function ProfileScreen() {
  const { 
    user, 
    logout, 
    updateProfile, 
    uploadAvatar, 
    isLoading: authLoading,
    reloadUserProfile
  } = useAuth();
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [avatarConfirmVisible, setAvatarConfirmVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [tempProvince, setTempProvince] = useState<string>("");
  const [tempDistrict, setTempDistrict] = useState<string>("");
  const [tempWard, setTempWard] = useState<string>("");
  const [tempStreet, setTempStreet] = useState<string>("");
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectType, setSelectType] = useState<'province' | 'district' | 'ward'>('province');
  const [selectOptions, setSelectOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [tempProvinceCode, setTempProvinceCode] = useState<string>("");
  const [tempDistrictCode, setTempDistrictCode] = useState<string>("");

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ và tên');
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address
      });
      Alert.alert('Thành công', 'Thông tin đã được cập nhật');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Cập nhật thông tin không thành công');
    } finally {
      setIsUpdating(false);
    }
  };

  const openAddressModal = () => {
    const current = formData.address || '';
    if (current && current.includes(',')) {
      const parts = current.split(',').map(p => p.trim());
      const [street = '', ward = '', district = '', province = ''] = parts;
      setTempStreet(street);
      setTempWard(ward);
      setTempDistrict(district);
      setTempProvince(province);
    } else {
      setTempStreet(''); setTempWard(''); setTempDistrict(''); setTempProvince('');
    }
    setAddressModalVisible(true);
  };

  const openSelect = async (type: 'province' | 'district' | 'ward') => {
    setSelectType(type);
    if (type === 'province') {
      const provinces = await apiService.getProvinces();
      setSelectOptions(provinces);
    } else if (type === 'district') {
      if (!tempProvinceCode) return;
      const districts = await apiService.getDistricts(tempProvinceCode);
      setSelectOptions(districts);
    } else {
      if (!tempDistrictCode) return;
      const wards = await apiService.getWards(tempDistrictCode);
      setSelectOptions(wards);
    }
    setSelectModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập vào thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarPreviewUri(result.assets[0].uri);
        setAvatarConfirmVisible(true);
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể chọn ảnh');
    }
  };

  const getDefaultAvatar = (user: User | null) => {
    if (!user) return null;
    
    const firstLetterOfLastName = user.lastName?.[0]?.toUpperCase() || '';
    const firstLetterOfFirstName = user.firstName?.[0]?.toUpperCase() || '';
    
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {`${firstLetterOfLastName}${firstLetterOfFirstName}`}
        </Text>
      </View>
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login' as never);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Đăng xuất không thành công');
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Không tìm thấy thông tin người dùng</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
          <Text style={styles.loginLink}>Đăng nhập lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Hồ sơ cá nhân</Text>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
              {user?.avatarUrl ? (
                <Image
                  source={{ 
                    uri: user.avatarUrl.startsWith('http') 
                      ? user.avatarUrl 
                      : `${BASE_URL}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`
                  }}
                  style={styles.avatar}
                  onError={e => {
                    console.log('Lỗi tải ảnh avatar:', e.nativeEvent);
                    console.log('URL gây lỗi:', user.avatarUrl);
                  }}
                />
              ) : (
                getDefaultAvatar(user)
              )}
              <View style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>

            <Text style={styles.userName}>{`${user.lastName} ${user.firstName}`}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          <View style={styles.content}>
            {isEditing ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Họ</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({...formData, lastName: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tên</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({...formData, firstName: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={formData.email}
                    editable={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Số điện thoại</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Địa chỉ</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={formData.address}
                    editable={false}
                    multiline
                  />
                  <TouchableOpacity style={styles.pickAddressBtn} onPress={openAddressModal}>
                    <Ionicons name="location-outline" size={16} color="#C87D55" />
                    <Text style={styles.pickAddressText}>Chọn theo Tỉnh/Quận/Phường</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={() => setIsEditing(false)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.buttonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={handleUpdateProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Lưu</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoCard}>
                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Họ và tên</Text>
                    <Text style={styles.infoText}>{`${formData.lastName} ${formData.firstName}`}</Text>
                  </View>

                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.infoText}>{formData.email}</Text>
                  </View>

                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <Text style={styles.infoText}>{formData.phone || 'Chưa cập nhật'}</Text>
                  </View>

                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Địa chỉ</Text>
                    <Text style={styles.infoText}>{formData.address || 'Chưa cập nhật'}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('OrderHistory' as never)}
                >
                  <Text style={styles.secondaryButtonText}>Lịch sử đơn hàng</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      {/* Address Modal */}
      {addressModalVisible && (
        <View style={styles.modalOverlay}> 
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn địa chỉ</Text>
            <Text style={styles.modalFieldLabel}>Tỉnh/Thành phố</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => openSelect('province')}>
              <Text style={tempProvince ? styles.selectValue : styles.selectPlaceholder}>
                {tempProvince || 'Chọn Tỉnh/Thành phố'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
            <Text style={styles.modalFieldLabel}>Quận/Huyện</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => openSelect('district')} disabled={!tempProvinceCode}>
              <Text style={tempDistrict ? styles.selectValue : styles.selectPlaceholder}>
                {tempDistrict || (tempProvinceCode ? 'Chọn Quận/Huyện' : 'Chọn Tỉnh/Thành phố trước')}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
            <Text style={styles.modalFieldLabel}>Phường/Xã</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => openSelect('ward')} disabled={!tempDistrictCode}>
              <Text style={tempWard ? styles.selectValue : styles.selectPlaceholder}>
                {tempWard || (tempDistrictCode ? 'Chọn Phường/Xã' : 'Chọn Quận/Huyện trước')}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
            
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.modalButton}>
                <Text>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const composed = [tempWard, tempDistrict, tempProvince]
                    .map(s => s && s.trim())
                    .filter(Boolean)
                    .join(', ');
                  setFormData({ ...formData, address: composed });
                  setAddressModalVisible(false);
                }}
                style={[styles.modalButton, { backgroundColor: '#C87D55' }]}
              >
                <Text style={{ color: '#fff' }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Select list modal */}
          {selectModalVisible && (
            <View style={styles.modalInnerOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {selectType === 'province' ? 'Chọn Tỉnh/Thành phố' : selectType === 'district' ? 'Chọn Quận/Huyện' : 'Chọn Phường/Xã'}
                </Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {selectOptions.map((item) => (
                    <TouchableOpacity
                      key={item.code || item.name}
                      style={{ paddingVertical: 10 }}
                      onPress={() => {
                        if (selectType === 'province') {
                          setTempProvince(item.name);
                          setTempProvinceCode(item.code);
                          setTempDistrict(''); setTempDistrictCode(''); setTempWard('');
                        } else if (selectType === 'district') {
                          setTempDistrict(item.name);
                          setTempDistrictCode(item.code);
                          setTempWard('');
                        } else {
                          setTempWard(item.name);
                        }
                        setSelectModalVisible(false);
                      }}
                    >
                      <Text style={{ fontSize: 15, color: '#333' }}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setSelectModalVisible(false)} style={styles.modalButton}>
                    <Text>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
      {/* Avatar confirm modal */}
      {avatarConfirmVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận cập nhật ảnh đại diện</Text>
            {avatarPreviewUri ? (
              <Image source={{ uri: avatarPreviewUri }} style={{ width: 160, height: 160, borderRadius: 80, alignSelf: 'center', marginVertical: 12 }} />
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setAvatarConfirmVisible(false); setAvatarPreviewUri(null); }} style={styles.modalButton}>
                <Text>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!avatarPreviewUri) return;
                  setIsUpdating(true);
                  try {
                    const uploadResult = await uploadAvatar(avatarPreviewUri);
                    console.log('avatarUrl trả về:', uploadResult.avatarUrl);
                    await reloadUserProfile();
                    Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
                    setAvatarConfirmVisible(false);
                    setAvatarPreviewUri(null);
                  } catch (error: any) {
                    console.error('Upload error:', error);
                    Alert.alert('Lỗi', error.message || 'Không thể tải lên ảnh');
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                style={[styles.modalButton, { backgroundColor: '#C87D55' }]}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Xác nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    color: '#333',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#888',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoGroup: {
    marginBottom: 16,
  },
  infoText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  pickAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pickAddressText: {
    marginLeft: 6,
    color: '#C87D55',
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    height: 50,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#333',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  loginLink: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  logoutButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FF3A30',
  },
  logoutButtonText: {
    color: '#FF3A30',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  modalInnerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center', zIndex: 110,
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '85%', elevation: 5,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  modalFieldLabel: { fontSize: 13, color: '#666', marginBottom: 6, marginTop: 6 },
  selectInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 12, minHeight: 40, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectPlaceholder: { fontSize: 15, color: '#999' },
  selectValue: { fontSize: 15, color: '#333' },
  modalInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6,
    padding: 10, minHeight: 40, marginBottom: 8, fontSize: 15, color: '#333',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, marginLeft: 10, backgroundColor: '#f0f0f0',
  },
});