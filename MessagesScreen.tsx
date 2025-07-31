import React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "./App";
import axios from "axios";

// Define types for chat items
interface ChatItem {
  id: string;
  name: string;
  message: string;
  image: any; // Replace `any` with `ImageSourcePropType` if stricter typing is preferred
  time?: string; // Optional for pinned chats
  unread?: number; // Optional for pinned chats
}

// Define props for the component
type MessagesScreenProps = BottomTabScreenProps<TabParamList, "Messages">;

// Define the API URL - change this to your Django backend URL
const API_URL = "http://your-django-backend-ip:8000";

const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState<string>("All chats");
  const [pinnedChats, setPinnedChats] = useState<ChatItem[]>([]);
  const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat data from the backend
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const pinnedResponse = await axios.get<ChatItem[]>(`${API_URL}/api/chats/pinned/`);
        const recentResponse = await axios.get<ChatItem[]>(`${API_URL}/api/chats/recent/`);

        setPinnedChats(pinnedResponse.data);
        setRecentChats(recentResponse.data);
      } catch (error) {
        console.error("Error fetching chat data:", error);
        setError("Failed to load chat data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, []);

  // Render function for pinned chats
  const renderPinnedChat = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity style={styles.pinnedChatItem}>
      <Image source={item.image} style={styles.pinnedChatImage} />
      <View style={styles.pinnedChatInfo}>
        <Text style={styles.pinnedChatName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.pinnedChatMessage} numberOfLines={1}>
          {item.message}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render function for recent chats
  const renderRecentChat = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity style={styles.recentChatItem}>
      <Image source={item.image} style={styles.recentChatImage} />
      <View style={styles.recentChatInfo}>
        <View style={styles.recentChatHeader}>
          <Text style={styles.recentChatName}>{item.name}</Text>
          {item.time && <Text style={styles.recentChatTime}>{item.time}</Text>}
        </View>
        <Text style={styles.recentChatMessage} numberOfLines={1}>
          {item.message}
        </Text>
      </View>
      {item.unread !== undefined && item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unread.toString()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render empty component for FlatList
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No chats available</Text>
    </View>
  );

  // Render loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  // Render error message
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pinned Chats</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pinnedChats}
        renderItem={renderPinnedChat}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pinnedChatsList}
        ListEmptyComponent={renderEmptyComponent}
      />

      <View style={styles.recentChatsHeader}>
        <Text style={styles.recentChatsTitle}>Recent Chats</Text>
        <View style={styles.filterContainer}>
          {["All chats", "Personal", "Groups"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={recentChats}
        renderItem={renderRecentChat}
        keyExtractor={(item) => item.id}
        style={styles.recentChatsList}
        ListEmptyComponent={renderEmptyComponent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  pinnedChatsList: {
    maxHeight: 100,
  },
  pinnedChatItem: {
    width: 80,
    marginRight: 10,
    alignItems: "center",
  },
  pinnedChatImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  pinnedChatInfo: {
    alignItems: "center",
  },
  pinnedChatName: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  pinnedChatMessage: {
    fontSize: 10,
    color: "#888",
    textAlign: "center",
  },
  recentChatsHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  recentChatsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#F0F0F0",
  },
  activeFilterButton: {
    backgroundColor: "#000",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterText: {
    color: "#FFF",
  },
  recentChatsList: {
    flex: 1,
  },
  recentChatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  recentChatImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  recentChatInfo: {
    flex: 1,
  },
  recentChatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  recentChatName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  recentChatTime: {
    fontSize: 12,
    color: "#888",
  },
  recentChatMessage: {
    fontSize: 14,
    color: "#666",
  },
  unreadBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default MessagesScreen;