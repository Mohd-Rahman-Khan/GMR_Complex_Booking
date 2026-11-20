import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenWrapper from '../../components/ScreenWrapper';
import AppText from '../../components/AppText';
import AppButton from '../../components/AppButton';
import { MainStackParamList } from '../../navigation/types';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');

type DetailsRoute = RouteProp<MainStackParamList, 'GroundDetails'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

type MasterSport = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
};

type MasterSportsResponse = {
  success: boolean;
  data: {
    sports: MasterSport[];
  };
};

type ComplexSport = {
  _id: string;
  name: string;
  sportName?: string;
  masterSportId?: string | MasterSport;
  icon?: string;
  image?: string;
  description?: string;
  isActive?: boolean;
  slots?: {
    _id?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    price?: number;
  }[];
  pricing?: {
    weekdayPrice?: number;
    weekdayPeakPrice?: number;
    weekendPrice?: number;
    weekendPeakPrice?: number;
    peakHours?: {
      startTime: string;
      endTime: string;
      price: number;
    }[];
  };
};

type Complex = {
  _id: string;
  name: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  description?: string;
  image?: string;
  coverImage?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  openingTime?: string;
  closingTime?: string;
  amenities?: string[];
  sports?: ComplexSport[];
  isActive?: boolean;
};

type ComplexResponse = {
  success: boolean;
  data: {
    complex: Complex;
  };
};

type SportsResponse = {
  success: boolean;
  data: {
    sports: ComplexSport[];
  };
};

type DisplaySport = ComplexSport & {
  masterName: string;
  masterIcon: string;
};

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

  const [complex, setComplex] = useState<Complex | null>(null);
  const [sports, setSports] = useState<DisplaySport[]>([]);
  const [masterSports, setMasterSports] = useState<MasterSport[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImage, setActiveImage] = useState(0);

  // Fetch complex details, its sports and master sports
  const fetchComplexDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch complex details
      const complexResponse = await apiRequest<ComplexResponse>(
        `/complexes/${groundId}`,
      );

      const fetchedComplex = complexResponse?.data?.complex;

      if (!fetchedComplex) {
        throw new Error('Complex details not found');
      }

      setComplex(fetchedComplex);

      // 2. Fetch complex sports and master sports
      const [sportsResult, masterResult] = await Promise.allSettled([
        apiRequest<SportsResponse>(`/sports/complex/${groundId}`),
        apiRequest<MasterSportsResponse>('/master-sports'),
      ]);

      // 3. Get master sports
      let fetchedMasterSports: MasterSport[] = [];

      if (masterResult.status === 'fulfilled') {
        fetchedMasterSports = masterResult.value?.data?.sports ?? [];
      } else {
        console.log('Master Sports API Error:', masterResult.reason);
      }

      setMasterSports(fetchedMasterSports);

      // 4. Get complex sports
      let fetchedComplexSports: ComplexSport[] = [];

      if (sportsResult.status === 'fulfilled') {
        fetchedComplexSports = sportsResult.value?.data?.sports ?? [];
      } else {
        // Fallback to embedded sports
        fetchedComplexSports = fetchedComplex.sports ?? [];

        console.log('Complex Sports API Error:', sportsResult.reason);
      }

      // 5. Filter active sports and match with master sports
      const activeSports = fetchedComplexSports.filter(
        sport => sport.isActive !== false,
      );

      const mappedSports: DisplaySport[] = activeSports.map(sport => {
        const masterId =
          typeof sport.masterSportId === 'string'
            ? sport.masterSportId
            : sport.masterSportId?._id;

        const masterSport = fetchedMasterSports.find(
          item =>
            (masterId && item._id === masterId) ||
            item.name.trim().toLowerCase() ===
              (sport.sportName || sport.name).trim().toLowerCase(),
        );

        return {
          ...sport,
          masterName: masterSport?.name || sport.sportName || sport.name,
          masterIcon: masterSport?.icon || sport.icon || '🏅',
        };
      });

      setSports(mappedSports);
    } catch (err: any) {
      console.log('Complex Details API Error:', err);

      setError(err?.message || 'Unable to load complex details');
    } finally {
      setLoading(false);
    }
  }, [groundId]);

  useEffect(() => {
    fetchComplexDetails();
  }, [fetchComplexDetails]);

  // Complex images
  const images = useMemo(() => {
    if (!complex) return [];

    const allImages = [
      ...(complex.images ?? []),
      complex.coverImage,
      complex.image,
    ].filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    );

    return [...new Set(allImages)];
  }, [complex]);

  // Get lowest price for one sport
  const getSportLowestPrice = (sport: ComplexSport): number | null => {
    const prices: number[] = [];

    sport.slots?.forEach(slot => {
      if (typeof slot.price === 'number' && slot.price > 0) {
        prices.push(slot.price);
      }
    });

    const pricing = sport.pricing;

    if (pricing) {
      [
        pricing.weekdayPrice,
        pricing.weekdayPeakPrice,
        pricing.weekendPrice,
        pricing.weekendPeakPrice,
      ].forEach(price => {
        if (typeof price === 'number' && price > 0) {
          prices.push(price);
        }
      });

      pricing.peakHours?.forEach(peak => {
        if (typeof peak.price === 'number' && peak.price > 0) {
          prices.push(peak.price);
        }
      });
    }

    return prices.length ? Math.min(...prices) : null;
  };

  // Lowest price across all sports
  const lowestPrice = useMemo(() => {
    const prices = sports
      .map(sport => getSportLowestPrice(sport))
      .filter((price): price is number => price !== null);

    return prices.length ? Math.min(...prices) : null;
  }, [sports]);

  // IMPORTANT:
  // SlotBooking ko complex ke embedded sport ki ID chahiye,
  // Master Sport ID nahi.
  const bookSport = (sportId: string) => {
    navigation.navigate('SlotBooking', {
      groundId,
      sportId,
    });
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={C.page} />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.green} />
          <AppText style={styles.loadingText}>
            Loading complex details...
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !complex) {
    return (
      <ScreenWrapper style={styles.screen}>
        <View style={styles.notFound}>
          <AppText variant="h3">{error || 'Venue not found'}</AppText>

          <AppButton title="Try Again" onPress={fetchComplexDetails} />

          <View style={styles.backAction}>
            <AppButton title="Go Back" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {images.length > 0 ? (
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
                  key={`${complex._id}-${index}`}
                  source={{ uri }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.heroFallback}>
              <AppText style={styles.heroFallbackIcon}>🏟️</AppText>
              <AppText style={styles.heroFallbackText}>SPORTS COMPLEX</AppText>
            </View>
          )}

          <View style={styles.overlay} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AppText style={styles.backText}>‹</AppText>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={styles.photoCount}>
              <AppText style={styles.photoText}>
                ▧ {Math.min(activeImage + 1, images.length)} / {images.length}
              </AppText>
            </View>
          )}

          <View style={styles.heroCopy}>
            <View style={styles.activePill}>
              <View style={styles.dot} />
              <AppText style={styles.activeText}>ACTIVE VENUE</AppText>
            </View>

            <AppText style={styles.heroTitle}>{complex.name}</AppText>

            <AppText style={styles.heroLocation}>
              ⌖{' '}
              {[complex.address, complex.city].filter(Boolean).join(', ') ||
                'Location not available'}
            </AppText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <AppText style={styles.statValue}>
                {typeof complex.rating === 'number'
                  ? `★ ${complex.rating.toFixed(1)}`
                  : '—'}
              </AppText>

              <AppText style={styles.statLabel}>
                {complex.reviews ?? 0}+ reviews
              </AppText>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <AppText style={styles.statValue}>{sports.length}</AppText>

              <AppText style={styles.statLabel}>Sports available</AppText>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <AppText style={styles.statValue}>◷</AppText>

              <AppText style={styles.statLabel}>Flexible slots</AppText>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <AppText style={styles.eyebrow}>WELCOME TO THE VENUE</AppText>

            <AppText style={styles.sectionTitle}>About this place</AppText>

            <AppText style={styles.description}>
              {complex.description ||
                'Enjoy your favourite sports at this venue.'}
            </AppText>

            {(complex.openingTime || complex.closingTime) && (
              <AppText style={styles.hours}>
                OPEN DAILY · {complex.openingTime || '--'} –{' '}
                {complex.closingTime || '--'}
              </AppText>
            )}
          </View>

          {/* Sports */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View>
                <AppText style={styles.eyebrow}>PICK YOUR GAME</AppText>

                <AppText style={styles.sectionTitle}>Choose a sport</AppText>
              </View>

              <View style={styles.sportCount}>
                <AppText style={styles.sportCountText}>
                  {sports.length} SPORTS
                </AppText>
              </View>
            </View>

            <AppText style={styles.helper}>
              Select a sport to see its own prices and available sessions.
            </AppText>

            {sports.length > 0 ? (
              sports.map(sport => {
                const minPrice = getSportLowestPrice(sport);

                return (
                  <TouchableOpacity
                    key={sport._id}
                    activeOpacity={0.85}
                    style={styles.sportCard}
                    onPress={() => bookSport(sport._id)}
                  >
                    {sport.image ? (
                      <Image
                        source={{ uri: sport.image }}
                        style={styles.sportImage}
                      />
                    ) : (
                      <View style={styles.sportImageFallback}>
                        <AppText style={styles.sportFallbackIcon}>
                          {sport.masterIcon}
                        </AppText>
                      </View>
                    )}

                    <View style={styles.sportInfo}>
                      <View style={styles.sportNameRow}>
                        <AppText style={styles.sportIcon}>
                          {sport.masterIcon}
                        </AppText>

                        <AppText style={styles.sportName}>
                          {sport.masterName}
                        </AppText>
                      </View>

                      <AppText style={styles.sportMeta}>
                        {sport.slots?.length
                          ? `${sport.slots.length} configured slots`
                          : 'Booking sessions available'}
                      </AppText>

                      <AppText style={styles.sportPrice}>
                        {minPrice !== null
                          ? `From ₹${minPrice.toLocaleString('en-IN')}`
                          : 'View pricing'}

                        {minPrice !== null && (
                          <AppText style={styles.perSession}>
                            {' '}
                            / session
                          </AppText>
                        )}
                      </AppText>
                    </View>

                    <View style={styles.chooseButton}>
                      <AppText style={styles.chooseArrow}>›</AppText>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptySports}>
                <AppText style={styles.emptySportsTitle}>
                  No sports available
                </AppText>

                <AppText style={styles.emptySportsSub}>
                  This complex has not added any active sports yet.
                </AppText>
              </View>
            )}
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <AppText style={styles.eyebrow}>VENUE FACILITIES</AppText>

            <AppText style={styles.sectionTitle}>Amenities</AppText>

            <View style={styles.amenities}>
              {(complex.amenities ?? []).length > 0 ? (
                complex.amenities?.map((amenity, index) => (
                  <View key={`${amenity}-${index}`} style={styles.amenity}>
                    <AppText style={styles.amenityCheck}>✓</AppText>

                    <AppText style={styles.amenityText}>{amenity}</AppText>
                  </View>
                ))
              ) : (
                <AppText style={styles.emptyAmenities}>
                  Facility information not available.
                </AppText>
              )}
            </View>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View>
          <AppText style={styles.bottomLabel}>SPORTS STARTING FROM</AppText>

          <AppText style={styles.bottomPrice}>
            {lowestPrice !== null
              ? `₹${lowestPrice.toLocaleString('en-IN')}`
              : 'View pricing'}
          </AppText>
        </View>

        <AppText style={styles.bottomHint}>Choose a sport above ↑</AppText>
      </View>
    </ScreenWrapper>
  );
};

// Keep your existing styles below this line.
// Add the following styles to your existing StyleSheet.

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.page,
  },

  loadingText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 12,
  },

  backAction: {
    marginTop: 12,
  },

  heroFallback: {
    width,
    height: 330,
    backgroundColor: C.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroFallbackIcon: {
    fontSize: 65,
  },

  heroFallbackText: {
    color: C.lime,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 10,
  },

  sportImageFallback: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#E7F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sportFallbackIcon: {
    fontSize: 30,
  },

  emptySports: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },

  emptySportsTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
  },

  emptySportsSub: {
    color: C.muted,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },

  emptyAmenities: {
    color: C.muted,
    fontSize: 12,
  },
});
export default GroundDetailsScreen;
