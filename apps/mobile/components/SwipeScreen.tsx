import { router } from "expo-router";
import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Swiper from "react-native-deck-swiper";

const { width, height } = Dimensions.get("window");

/* 40 PROPIEDADES MOCK REALISTAS */
const mockProperties = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    price: "$650 USD",
    location: "Caballito, Buenos Aires",
    bedrooms: 1,
    m2: 45,
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800",
    price: "$850 USD",
    location: "Palermo, Buenos Aires",
    bedrooms: 2,
    m2: 68,
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    price: "$1200 USD",
    location: "Recoleta, Buenos Aires",
    bedrooms: 3,
    m2: 92,
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1600573472591-ee6b68d14b61?w=800",
    price: "$780 USD",
    location: "Belgrano, Buenos Aires",
    bedrooms: 2,
    m2: 60,
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
    price: "$990 USD",
    location: "Nuñez, Buenos Aires",
    bedrooms: 2,
    m2: 75,
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    price: "$700 USD",
    location: "Almagro, Buenos Aires",
    bedrooms: 1,
    m2: 50,
  },
  {
    id: "7",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
    price: "$1100 USD",
    location: "Colegiales, Buenos Aires",
    bedrooms: 3,
    m2: 95,
  },
  {
    id: "8",
    image: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800",
    price: "$880 USD",
    location: "Villa Crespo, Buenos Aires",
    bedrooms: 2,
    m2: 70,
  },
  {
    id: "9",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    price: "$760 USD",
    location: "San Telmo, Buenos Aires",
    bedrooms: 1,
    m2: 48,
  },
  {
    id: "10",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800",
    price: "$1350 USD",
    location: "Puerto Madero, Buenos Aires",
    bedrooms: 3,
    m2: 110,
  },
  {
    id: "11",
    image: "https://images.unsplash.com/photo-1600573472436-5a8b3b36a6b2?w=800",
    price: "$890 USD",
    location: "Palermo Soho",
    bedrooms: 2,
    m2: 72,
  },
  {
    id: "12",
    image: "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800",
    price: "$980 USD",
    location: "Palermo Hollywood",
    bedrooms: 2,
    m2: 80,
  },
  {
    id: "13",
    image: "https://images.unsplash.com/photo-1600607687644-c7f34b5063b6?w=800",
    price: "$720 USD",
    location: "Flores",
    bedrooms: 1,
    m2: 46,
  },
  {
    id: "14",
    image: "https://images.unsplash.com/photo-1600047509355-6d5f9e0fbb42?w=800",
    price: "$1500 USD",
    location: "Puerto Madero",
    bedrooms: 3,
    m2: 120,
  },
  {
    id: "15",
    image: "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800",
    price: "$830 USD",
    location: "Belgrano R",
    bedrooms: 2,
    m2: 67,
  },
  {
    id: "16",
    image: "https://images.unsplash.com/photo-1600047509345-649a3b86d4f4?w=800",
    price: "$910 USD",
    location: "Villa Urquiza",
    bedrooms: 2,
    m2: 73,
  },
  {
    id: "17",
    image: "https://images.unsplash.com/photo-1600573472616-57d6cbb0f1a3?w=800",
    price: "$680 USD",
    location: "Boedo",
    bedrooms: 1,
    m2: 44,
  },
  {
    id: "18",
    image: "https://images.unsplash.com/photo-1600566752734-4c3d3a3f7e59?w=800",
    price: "$1150 USD",
    location: "Recoleta",
    bedrooms: 3,
    m2: 100,
  },
  {
    id: "19",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09d0bdf2?w=800",
    price: "$770 USD",
    location: "Caballito",
    bedrooms: 2,
    m2: 62,
  },
  {
    id: "20",
    image: "https://images.unsplash.com/photo-1600210492781-3b3d9c19d1ba?w=800",
    price: "$950 USD",
    location: "Chacarita",
    bedrooms: 2,
    m2: 78,
  },

  // 🔥 duplicamos variando datos hasta 40

  ...Array.from({ length: 20 }).map((_, i) => ({
    id: String(21 + i),
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    price: `$${700 + i * 20} USD`,
    location: "Buenos Aires",
    bedrooms: (i % 4) + 1,
    m2: 50 + i,
  })),
];

export default function SwipeScreen() {
  const swiperRef = useRef<Swiper<any>>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Verlo</Text>
        <Text style={styles.subtitle}>Deslizá para ver más</Text>
      </View>

        <TouchableOpacity
          style={{ alignSelf: "center", marginTop: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: "#0f172a" }}
        onPress={() => router.push("/(owner)/publicar")}
            >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Soy propietario · Publicar</Text>
        </TouchableOpacity>

      <View style={styles.swiperWrapper}>
        <Swiper
          ref={swiperRef}
          cards={mockProperties}
          renderCard={(card) => {
            if (!card) return null;

            return (
              <View style={styles.card}>
                <Image
                  source={{ uri: card.image }}
                  style={styles.image}
                />

                <View style={styles.overlay} />

                <View style={styles.info}>
                  <Text style={styles.price}>{card.price}</Text>
                  <Text style={styles.location}>{card.location}</Text>
                  <Text style={styles.details}>
                    {card.bedrooms} ambientes • {card.m2}m²
                  </Text>
                </View>
              </View>
            );
          }}
          stackSize={3}
          backgroundColor="transparent"
          cardVerticalMargin={20}
        />
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.nopeButton}
          onPress={() => swiperRef.current?.swipeLeft()}
        >
          <Text style={styles.nopeText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => swiperRef.current?.swipeRight()}
        >
          <Text style={styles.likeText}>❤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

header: {
  paddingTop: 20,
  paddingBottom: 16,
  alignItems: "center",
},

  logo: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },

  swiperWrapper: {
    flex: 1,
    justifyContent: "center",
  },

  card: {
    height: height * 0.72,
    borderRadius: 24,
    overflow: "hidden",
    marginHorizontal: 16,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  info: {
    position: "absolute",
    bottom: 30,
    left: 20,
  },

  price: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },

  location: {
    color: "#fff",
    fontSize: 18,
    marginTop: 4,
  },

  details: {
    color: "#e2e8f0",
    fontSize: 15,
    marginTop: 6,
  },

  buttons: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    zIndex: 1000, // 🔥 encima del swiper
  },

  nopeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },

  likeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ec4899",
    alignItems: "center",
    justifyContent: "center",
  },

  nopeText: {
    fontSize: 30,
    color: "#111",
  },

  likeText: {
    fontSize: 30,
    color: "#fff",
  },
});