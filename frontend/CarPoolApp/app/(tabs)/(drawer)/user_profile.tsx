import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import ApiService from '../../../services/api';

// Interface for the combined User & UserProfile data
interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  profile: {
    id: string;
    user_id: string;
    age: number | null;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
    bio: string | null;
    smoking: boolean;
    pets: boolean;
    music: boolean;
    chatty: boolean;
    rating: number | null;
    total_rides: number;
  };
}

export default function UserProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    bio: '',
    smoking: false,
    pets: false,
    music: false,
    chatty: false,
  });

  // Fetch profile data on load
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getProfile();
      if (response.success && response.user) {
        setProfile(response.user);
        // Initialize form data
        setFormData({
          name: response.user.name || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          age: response.user.profile?.age?.toString() || '',
          bio: response.user.profile?.bio || '',
          smoking: response.user.profile?.smoking || false,
          pets: response.user.profile?.pets || false,
          music: response.user.profile?.music || false,
          chatty: response.user.profile?.chatty || false,
        });
        setIsGuest(false);
      } else {
        setIsGuest(true);
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      if (error.message.includes('Access denied')) {
        setIsGuest(true);
      } else {
        Alert.alert('Error', 'Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle form input changes
  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age, 10) : null,
        bio: formData.bio,
        smoking: formData.smoking,
        pets: formData.pets,
        music: formData.music,
        chatty: formData.chatty,
      };

      const response = await ApiService.updateProfile(updates);
      
      if (response.success && response.user) {
        setProfile(response.user); // Update local profile with new data
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully.');
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    if (profile) {
      // Reset form data to match the last saved profile
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        age: profile.profile?.age?.toString() || '',
        bio: profile.profile?.bio || '',
        smoking: profile.profile?.smoking || false,
        pets: profile.profile?.pets || false,
        music: profile.profile?.music || false,
        chatty: profile.profile?.chatty || false,
      });
    }
    setIsEditing(false);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // --- Render Loading ---
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // --- Render Guest ---
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Please log in</Text>
          <Text style={styles.emptySubtext}>Log in to view your profile.</Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.signInButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Render Profile ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.memberSince}>
            Member since {profile ? formatDate(profile.created_at) : '...'}
          </Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
            disabled={isEditing} // Disable "Edit" when already editing
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* --- Account Details --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <InputRow 
            label="Name" 
            value={formData.name}
            onChangeText={(val) => handleChange('name', val)}
            editable={isEditing}
          />
          <InputRow 
            label="Email" 
            value={formData.email}
            onChangeText={(val) => handleChange('email', val)}
            editable={isEditing}
            keyboardType="email-address"
          />
          <InputRow 
            label="Phone" 
            value={formData.phone}
            onChangeText={(val) => handleChange('phone', val)}
            editable={isEditing}
            keyboardType="phone-pad"
          />
          <InputRow 
            label="Age" 
            value={formData.age}
            onChangeText={(val) => handleChange('age', val)}
            editable={isEditing}
            keyboardType="number-pad"
          />
        </View>

        {/* --- Bio --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <TextInput
            style={[styles.textInput, styles.bioInput, isEditing && styles.editableInput]}
            value={formData.bio}
            onChangeText={(val) => handleChange('bio', val)}
            editable={isEditing}
            multiline
            placeholder="Tell us a bit about yourself..."
          />
        </View>

        {/* --- Preferences --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SwitchRow
            label="Smoking Friendly"
            value={formData.smoking}
            onValueChange={(val) => handleChange('smoking', val)}
            disabled={!isEditing}
          />
          <SwitchRow
            label="Pet Friendly"
            value={formData.pets}
            onValueChange={(val) => handleChange('pets', val)}
            disabled={!isEditing}
          />
          <SwitchRow
            label="Likes Music"
            value={formData.music}
            onValueChange={(val) => handleChange('music', val)}
            disabled={!isEditing}
          />
          <SwitchRow
            label="Likes to Chat"
            value={formData.chatty}
            onValueChange={(val) => handleChange('chatty', val)}
            disabled={!isEditing}
          />
        </View>

        {/* --- Edit Mode Buttons --- */}
        {isEditing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Reusable Components ---

const InputRow = ({ label, value, onChangeText, editable, keyboardType = 'default' }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
}) => (
  <View style={styles.inputRow}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.textInput, editable && styles.editableInput]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType}
      autoCapitalize={keyboardType === 'default' ? 'words' : 'none'}
    />
  </View>
);

const SwitchRow = ({ label, value, onValueChange, disabled }: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
}) => (
  <View style={styles.switchRow}>
    <Text style={styles.label}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: "#767577", true: "#007AFF" }}
      thumbColor={"#f4f3f4"}
    />
  </View>
);

// --- Styles ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  textInput: {
    flex: 2,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  editableInput: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonContainer: {
    padding: 20,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#34C759', // Green
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderColor: '#FF3B30', // Red
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});