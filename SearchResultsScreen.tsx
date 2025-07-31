"use client";

import React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "./App";
import axios from "axios";

// Define types for search result items
interface SearchResult {
  id: string;
  username: string;
  fullName: string;
  followers?: string; // Optional property
  verified: boolean;
  image: any; // Can refine this to be an ImageSourcePropType if desired
}

// Define props for the component
type SearchResultsScreenProps = BottomTabScreenProps<TabParamList, "Search">;

// Define the API URL - change this to your Django backend URL
const API_URL = "http://your-django-backend-ip:8000";

const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState<string>("People");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch search results from the backend
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.trim() === "") {
        setFilteredResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get<SearchResult[]>(`${API_URL}/api/search/`, {
          params: { query: searchQuery, filter: activeFilter },
        });
        setFilteredResults(response.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setError("Failed to load search results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery, activeFilter]);

  // Render function for search results
  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => {
        // Navigate to user profile or show user details
        alert(`Viewing profile of ${item.username}`);
      }}
    >
      <Image source={item.image} style={styles.profileImage} />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.fullName}>{item.fullName}</Text>
        {item.followers && <Text style={styles.followers}>Followed by {item.followers}</Text>}
      </View>
      {item.verified && <Ionicons name="checkmark-circle" size={20} color="#1DA1F2" style={styles.verifiedIcon} />}
    </TouchableOpacity>
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
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search username"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          {searchQuery.length > 0 && <Ionicons name="close-circle" size={20} color="#999" />}
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {["People", "Posts", "#tags"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredResults.length > 0 ? (
        <FlatList
          data={filteredResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
          <Text style={styles.noResultsSubtext}>Try searching for a different username</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
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
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  fullName: {
    fontSize: 14,
    color: "#666",
  },
  followers: {
    fontSize: 12,
    color: "#999",
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default SearchResultsScreen;