import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppText from '../../components/AppText';
import AppButton from '../../components/AppButton';
import { grounds } from '../../data/grounds';
import { MainStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
type DetailsRoute = RouteProp<MainStackParamList, 'GroundDetails'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const C = {
  page: '#F5F7F4',
  ink: '#17231D',
  muted: '#78857D',
  green: '#176B45',
  greenDark: '#104B32',
  lime: '#D9F36A',
  white: '#FFFFFF',
  line: '#E8EDE9',
  dark: '#10251B',
};

const GroundDetailsScreen = () => {
  const route = useRoute<DetailsRoute>();
  const navigation = useNavigation<NavigationProp>();
  const { groundId } = route.params;
  const ground = grounds.find(item => item.id === groundId);
  const [activeImage, setActiveImage] = useState(0);

  const images = useMemo(
    () =>
      ground
        ? ground.images?.filter(Boolean).length
          ? ground.images.filter(Boolean)
          : [ground.image]
        : [],
    [ground],
  );

  if (!ground) {
    return (
      <ScreenWrapper style={styles.screen}>
        <View style={styles.notFound}>
          <AppText variant="h3">Venue not found</AppText>
          <AppButton title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </ScreenWrapper>
    );
  }

  const bookSport = (sportId: string) =>
    navigation.navigate('SlotBooking', { groundId: ground.id, sportId });

  const lowestPrice = Math.min(
    ...ground.sports.flatMap(s => s.slots.map(slot => slot.price)),
  );

  return (
    <ScreenWrapper style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event =>
              setActiveImage(
                Math.round(event.nativeEvent.contentOffset.x / width),
              )
            }
          >
            {images.map((uri, index) => (
              <Image
                key={`${ground.id}-${index}`}
                source={{ uri }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.overlay} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AppText style={styles.backText}>‹</AppText>
          </TouchableOpacity>
          <View style={styles.photoCount}>
            <AppText style={styles.photoText}>
              ▧ {Math.min(activeImage + 1, images.length)} / {images.length}
            </AppText>
          </View>
          <View style={styles.heroCopy}>
            <View style={styles.activePill}>
              <View style={styles.dot} />
              <AppText style={styles.activeText}>ACTIVE VENUE</AppText>
            </View>
            <AppText style={styles.heroTitle}>{ground.name}</AppText>
            <AppText style={styles.heroLocation}>⌖ {ground.location}</AppText>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <AppText style={styles.statValue}>★ {ground.rating}</AppText>
              <AppText style={styles.statLabel}>
                {ground.reviews}+ reviews
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <AppText style={styles.statValue}>{ground.sports.length}</AppText>
              <AppText style={styles.statLabel}>Sports available</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <AppText style={styles.statValue}>◷</AppText>
              <AppText style={styles.statLabel}>Flexible slots</AppText>
            </View>
          </View>

          <View style={styles.section}>
            <AppText style={styles.eyebrow}>WELCOME TO THE VENUE</AppText>
            <AppText style={styles.sectionTitle}>About this place</AppText>
            <AppText style={styles.description}>{ground.description}</AppText>
            <AppText style={styles.hours}>
              OPEN DAILY · {ground.openingTime} – {ground.closingTime}
            </AppText>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View>
                <AppText style={styles.eyebrow}>PICK YOUR GAME</AppText>
                <AppText style={styles.sectionTitle}>Choose a sport</AppText>
              </View>
              <View style={styles.sportCount}>
                <AppText style={styles.sportCountText}>
                  {ground.sports.length} SPORTS
                </AppText>
              </View>
            </View>
            <AppText style={styles.helper}>
              Select a sport to see its own prices and available sessions.
            </AppText>
            {ground.sports.map(sport => {
              const minPrice = Math.min(...sport.slots.map(slot => slot.price));
              return (
                <TouchableOpacity
                  key={sport.sportId}
                  activeOpacity={0.85}
                  style={styles.sportCard}
                  onPress={() => bookSport(sport.sportId)}
                >
                  <Image
                    source={{ uri: sport.image }}
                    style={styles.sportImage}
                  />
                  <View style={styles.sportInfo}>
                    <View style={styles.sportNameRow}>
                      <AppText style={styles.sportIcon}>{sport.icon}</AppText>
                      <AppText style={styles.sportName}>
                        {sport.sportName}
                      </AppText>
                    </View>
                    <AppText style={styles.sportMeta}>
                      2 Hours · 4 Hours · Full Day booking
                    </AppText>
                    <AppText style={styles.sportPrice}>
                      From ₹{minPrice.toLocaleString('en-IN')}{' '}
                      <AppText style={styles.perSession}>/ session</AppText>
                    </AppText>
                  </View>
                  <View style={styles.chooseButton}>
                    <AppText style={styles.chooseArrow}>›</AppText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.section}>
            <AppText style={styles.eyebrow}>VENUE FACILITIES</AppText>
            <AppText style={styles.sectionTitle}>Amenities</AppText>
            <View style={styles.amenities}>
              {ground.amenities.map((amenity, i) => (
                <View key={`${amenity}-${i}`} style={styles.amenity}>
                  <AppText style={styles.amenityCheck}>✓</AppText>
                  <AppText style={styles.amenityText}>{amenity}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <View>
          <AppText style={styles.bottomLabel}>SPORTS STARTING FROM</AppText>
          <AppText style={styles.bottomPrice}>
            ₹{lowestPrice.toLocaleString('en-IN')}
          </AppText>
        </View>
        <AppText style={styles.bottomHint}>Choose a sport above ↑</AppText>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page, paddingHorizontal: 0 },
  scrollContent: { paddingBottom: 8 },
  hero: { height: 340, width: '100%', backgroundColor: C.dark },
  heroImage: { width, height: 340 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,24,16,0.42)',
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: C.ink, fontSize: 32, lineHeight: 36, marginTop: -5 },
  photoCount: {
    position: 'absolute',
    top: 19,
    right: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  photoText: { color: C.white, fontSize: 11, fontWeight: '800' },
  heroCopy: { position: 'absolute', left: 22, right: 22, bottom: 28 },
  activePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.lime,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.greenDark,
    marginRight: 7,
  },
  activeText: {
    color: C.greenDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroTitle: { color: C.white, fontSize: 28, fontWeight: '900' },
  heroLocation: { color: '#E5EEE8', fontSize: 12, marginTop: 7 },
  content: {
    backgroundColor: C.page,
    marginTop: -1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: C.greenDark, fontSize: 15, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 9, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: C.line },
  section: { marginTop: 26 },
  eyebrow: {
    color: C.green,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  description: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 8 },
  hours: {
    color: C.green,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sportCount: {
    backgroundColor: '#E8F1EA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  sportCountText: { color: C.greenDark, fontSize: 9, fontWeight: '900' },
  helper: { color: C.muted, fontSize: 11, marginTop: 6, marginBottom: 13 },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 17,
    padding: 10,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 10,
  },
  sportImage: {
    width: 76,
    height: 78,
    borderRadius: 12,
    backgroundColor: '#E6ECE7',
  },
  sportInfo: { flex: 1, paddingHorizontal: 12 },
  sportNameRow: { flexDirection: 'row', alignItems: 'center' },
  sportIcon: { fontSize: 17, marginRight: 7 },
  sportName: { color: C.ink, fontSize: 14, fontWeight: '900' },
  sportMeta: { color: C.muted, fontSize: 10, marginTop: 5 },
  sportPrice: {
    color: C.greenDark,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 7,
  },
  perSession: { color: C.muted, fontSize: 9, fontWeight: '500' },
  chooseButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#EAF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseArrow: { color: C.greenDark, fontSize: 24, lineHeight: 27 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: C.line,
  },
  amenityCheck: {
    color: C.green,
    fontSize: 12,
    fontWeight: '900',
    marginRight: 6,
  },
  amenityText: { color: C.ink, fontSize: 10, fontWeight: '700' },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  bottomLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bottomPrice: {
    color: C.greenDark,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  bottomHint: { color: C.green, fontSize: 11, fontWeight: '800' },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
export default GroundDetailsScreen;
