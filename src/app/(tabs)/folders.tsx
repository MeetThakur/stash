import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { FolderClosed, ChevronLeft, ArrowRight, Plus, Trash2, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useStashStore, StashItem } from '../../store/useStashStore';
import { LinkCard } from '../../components/LinkCard';
import { EmptyState } from '../../components/EmptyState';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../../styles/theme';

type FolderData = {
  name: string;
  count: number;
};

export default function FoldersScreen() {
  const colors = useThemeColors();
  const items = useStashStore((state) => state.items);
  const customFolders = useStashStore((state) => state.folders);
  const createFolder = useStashStore((state) => state.createFolder);
  const deleteFolder = useStashStore((state) => state.deleteFolder);

  // Active folder selection for in-page drill down
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  
  // Create Folder Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Aggregate unique folders and count items
  const folderList = useMemo((): FolderData[] => {
    const counts: Record<string, number> = {};
    let uncategorizedCount = 0;

    items.forEach((item) => {
      if (item.folder && item.folder.trim() !== '' && item.folder.toLowerCase() !== 'uncategorized') {
        const key = item.folder.trim();
        counts[key] = (counts[key] || 0) + 1;
      } else {
        uncategorizedCount++;
      }
    });

    // Add custom folders that might have 0 items
    customFolders.forEach(folder => {
      if (!counts[folder]) counts[folder] = 0;
    });

    const list: FolderData[] = Object.keys(counts).map((name) => ({
      name,
      count: counts[name],
    }));

    // Put Uncategorized folder at the top/beginning if there are uncategorized items
    if (uncategorizedCount > 0 || list.length === 0) {
      list.unshift({ name: 'Uncategorized', count: uncategorizedCount });
    }

    return list;
  }, [items, customFolders]);

  // Items for the currently selected folder
  const activeFolderItems = useMemo((): StashItem[] => {
    if (!activeFolder) return [];

    return items.filter((item) => {
      if (activeFolder === 'Uncategorized') {
        return !item.folder || item.folder.trim() === '' || item.folder.toLowerCase() === 'uncategorized';
      }
      return item.folder === activeFolder;
    });
  }, [items, activeFolder]);

  // Back from sub-feed
  const handleGoBack = () => {
    setActiveFolder(null);
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolder(name);
    setCreateModalVisible(false);
    setNewFolderName('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Folder Created', text2: name });
  };

  const handleDeleteFolder = () => {
    if (!activeFolder) return;
    deleteFolder(activeFolder);
    setActiveFolder(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Folder Deleted', text2: activeFolder });
  };

  if (activeFolder) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Sub Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.textPrimary} />
            <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Folders</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {activeFolder}
          </Text>
          <View style={{ width: 80, alignItems: 'flex-end' }}>
            {customFolders.includes(activeFolder) && (
              <TouchableOpacity onPress={handleDeleteFolder} style={{ padding: 8 }}>
                <Trash2 size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Folder items feed */}
        {activeFolderItems.length === 0 ? (
          <EmptyState message={`No items in ${activeFolder}.`} />
        ) : (
          <FlashList
            data={activeFolderItems}
            renderItem={({ item, index }) => <LinkCard item={item} index={index} />}
            contentContainerStyle={styles.subListContent}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Folders</Text>
        <TouchableOpacity style={{ width: 40, alignItems: 'flex-end', padding: 8 }} onPress={() => setCreateModalVisible(true)}>
          <Plus size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlashList
          data={folderList}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.gridCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setActiveFolder(item.name)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.folderIconContainer, { backgroundColor: colors.surfaceRaised }]}>
                  <FolderClosed size={20} color={colors.accent} />
                </View>
                <ArrowRight size={14} color={colors.textSecondary} />
              </View>

              <Text style={[styles.folderName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>

              <Text style={[styles.itemCountText, { color: colors.textSecondary }]}>
                {item.count} {item.count === 1 ? 'item' : 'items'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create Folder Modal */}
      {createModalVisible && (
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Folder</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.modalInput, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.textPrimary }]}
              autoFocus
            />
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.accent }]} onPress={handleCreateFolder}>
              <Text style={[styles.submitButtonText, { color: '#0E0E0E' }]}>Create Folder</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    width: 80,
  },
  backButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    marginLeft: 2,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingLg,
    textAlign: 'center',
    flex: 1,
  },
  gridContent: {
    padding: 16,
  },
  gridCard: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: LAYOUT.cardRadius,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  folderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderName: {
    ...TYPOGRAPHY.headingSm,
    fontSize: 15,
    marginBottom: 4,
  },
  itemCountText: {
    ...TYPOGRAPHY.meta,
  },
  subListContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...TYPOGRAPHY.headingSm,
  },
  modalInput: {
    ...TYPOGRAPHY.body,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
});
