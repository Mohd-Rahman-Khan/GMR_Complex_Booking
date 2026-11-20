import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { apiRequest } from '../../services/api';

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
  count: number;
  data: {
    sports: MasterSport[];
  };
};

type Sport = {
  _id: string;
  name: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  masterSportId?: string;
  slots?: {
    _id?: string;
    startTime?: string;
    endTime?: string;
    price?: number;
    duration?: number;
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
  address?: string;
  city?: string;
  description?: string;
  image?: string;
  images?: string[];
  coverImage?: string;
  rating?: number;
  sports?: Sport[];
  isActive: boolean;
};

type ComplexesResponse = {
  success: boolean;
  count: number;
  data: {
    complexes: Complex[];
  };
};

type SportsResponse = {
  success: boolean;
  count: number;
  data: {
    sports: Sport[];
  };
};

const C = {
  bg: '#F4F7F4',
  white: '#FFFFFF',
  ink: '#14251C',
  muted: '#829087',
  green: '#168653',
  greenLight: '#E7F4EC',
  lime: '#B8F36B',
  line: '#E7EDE8',
  dark: '#10291E',
  orange: '#FFB45E',
};

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [sports, setSports] = useState<MasterSport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const firstName = user?.name?.trim()?.split(' ')[0] || 'Player';

  // Fetch Master Sports and Complexes
  const fetchHomeData = useCallback(async () => {
    try {
      setError('');

      // 1. Fetch Master Sports and Complexes together
      const [masterSportsResponse, complexResponse] = await Promise.all([
        apiRequest<MasterSportsResponse>('/master-sports'),
        apiRequest<ComplexesResponse>('/complexes'),
      ]);

      // 2. Master sports for Explore Sports section
      const masterSports = masterSportsResponse?.data?.sports ?? [];

      setSports(masterSports);

      // 3. Get active complexes
      const fetchedComplexes = complexResponse?.data?.complexes ?? [];

      const activeComplexes = fetchedComplexes.filter(
        item => item.isActive !== false,
      );

      // 4. Fetch sports for every complex
      const sportsResponses = await Promise.allSettled(
        activeComplexes.map(complex =>
          apiRequest<SportsResponse>(`/sports/complex/${complex._id}`),
        ),
      );

      // 5. Attach sports to their respective complexes
      const enrichedComplexes = activeComplexes.map((complex, index) => {
        const result = sportsResponses[index];

        let complexSports: Sport[] = [];

        if (result?.status === 'fulfilled') {
          complexSports = result.value?.data?.sports ?? [];
        } else {
          // Fallback to embedded sports if API fails
          complexSports = complex.sports ?? [];
        }

        const activeSports = complexSports.filter(
          sport => sport.isActive !== false,
        );

        return {
          ...complex,
          sports: activeSports,
        };
      });

      // 6. Update complexes
      setComplexes(enrichedComplexes);
    } catch (err: any) {
      console.log('Home API Error:', err);

      setError(err?.message || 'Unable to load home data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  // Active complexes
  const activeGrounds = useMemo(
    () => complexes.filter(item => item.isActive !== false),
    [complexes],
  );

  // Search and popular complexes
  const popularGrounds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activeGrounds
      .filter(item => {
        const complexSports = item.sports ?? [];

        const sportNames = complexSports.map(sport => sport.name).join(' ');

        const searchableText = [item.name, item.city, item.address, sportNames]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return !query || searchableText.includes(query);
      })
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 6);
  }, [activeGrounds, search]);

  // Navigate to sports listing
  const openExplore = (sportId?: string, sportName?: string) => {
    navigation.navigate('GroundListing', {
      sportId,
      sportName,
    });
  };

  // Navigate to complex details
  const openGround = (complexId: string) => {
    navigation.navigate('GroundDetails', {
      groundId: complexId,
    });
  };

  // Get complex starting price
  const getStartingPrice = (item: Complex): number | null => {
    const prices: number[] = [];

    (item.sports ?? []).forEach(sport => {
      sport.slots?.forEach(slot => {
        if (
          typeof slot.price === 'number' &&
          Number.isFinite(slot.price) &&
          slot.price > 0
        ) {
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
          if (
            typeof price === 'number' &&
            Number.isFinite(price) &&
            price > 0
          ) {
            prices.push(price);
          }
        });

        pricing.peakHours?.forEach(peak => {
          if (
            typeof peak.price === 'number' &&
            Number.isFinite(peak.price) &&
            peak.price > 0
          ) {
            prices.push(peak.price);
          }
        });
      }
    });

    return prices.length ? Math.min(...prices) : null;
  };

  // Get sports available in a complex
  const getComplexSports = (item: Complex) => {
    return (item.sports ?? [])
      .filter(sport => sport.isActive !== false)
      .map(sport => sport.name);
  };

  // Get complex image
  const getComplexImage = (item: Complex) => {
    return item.image || item.coverImage || item.images?.[0] || '';
  };

  return (
    <ScreenWrapper style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.green}
            colors={[C.green]}
          />
        }
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>G</Text>
            </View>

            <View>
              <Text style={styles.brandName}>
                G<Text style={styles.brandGreen}>MR</Text>
              </Text>

              <Text style={styles.brandCaption}>FIND YOUR PLAYING FIELD</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8}>
            <Text style={styles.avatarText}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text style={styles.eyebrow}>LET'S GET MOVING</Text>

            <Text style={styles.greeting}>Hey, {firstName} 👋</Text>

            <Text style={styles.greetingSub}>What are we playing today?</Text>
          </View>

          <View style={styles.locationPill}>
            <Text style={styles.pin}>⌖</Text>
            <Text style={styles.locationText}>Noida</Text>
            <Text style={styles.chevron}>⌄</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchGlyph}>⌕</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search sport, ground or location"
            placeholderTextColor="#9AA69E"
            style={styles.searchInput}
            returnKeyType="search"
          />

          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.searchAction}
            onPress={() => openExplore()}
            activeOpacity={0.8}
          >
            <Text style={styles.searchActionText}>☷</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroDecorCircleLarge} />
          <View style={styles.heroDecorCircleSmall} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroTag}>
              <View style={styles.heroTagDot} />
              <Text style={styles.heroTagText}>YOUR GAME STARTS HERE</Text>
            </View>

            <Text style={styles.heroSportIcon}>🏆</Text>
          </View>

          <Text style={styles.heroTitle}>
            Make time for{'\n'}
            <Text style={styles.heroTitleAccent}>your game.</Text>
          </Text>

          <Text style={styles.heroSub}>
            Discover great sports venues and book your next match in just a few
            taps.
          </Text>

          <View style={styles.heroBottomRow}>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => openExplore()}
              activeOpacity={0.85}
            >
              <Text style={styles.heroButtonText}>Explore grounds</Text>
              <Text style={styles.heroButtonArrow}>↗</Text>
            </TouchableOpacity>

            <View style={styles.heroMiniNote}>
              <Text style={styles.heroMiniNoteTop}>READY TO PLAY?</Text>
              <Text style={styles.heroMiniNoteBottom}>Let's go!</Text>
            </View>
          </View>
        </View>

        {/* Quick facts */}
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {sports.length.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.metricLabel}>SPORTS</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {activeGrounds.length.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.metricLabel}>VENUES</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <Text style={styles.metricValue}>EASY</Text>
            <Text style={styles.metricLabel}>BOOKING</Text>
          </View>
        </View>

        {/* Master Sports */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionKicker}>PICK YOUR GAME</Text>
              <Text style={styles.sectionTitle}>Explore sports</Text>
            </View>

            <TouchableOpacity
              onPress={() => openExplore()}
              style={styles.seeAll}
            >
              <Text style={styles.seeAllText}>View all</Text>
              <Text style={styles.seeAllArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.apiLoading}>
              <ActivityIndicator size="small" color={C.green} />
              <Text style={styles.apiLoadingText}>Loading sports...</Text>
            </View>
          ) : sports.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sportList}
            >
              {sports.map(item => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.sportTile}
                  activeOpacity={0.86}
                  onPress={() => openExplore(item._id, item.name)}
                >
                  <View style={styles.sportImage}>
                    <View style={styles.sportImageShade} />

                    <Text style={styles.sportEmoji}>{item.icon || '🏅'}</Text>

                    <View style={styles.sportTileBottom}>
                      <Text style={styles.sportTileName}>{item.name}</Text>
                      <Text style={styles.sportTileArrow}>↗</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No sports available</Text>
              <Text style={styles.emptySub}>
                Master sports will appear here.
              </Text>
            </View>
          )}
        </View>

        {/* Popular complexes */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionKicker}>PLAYER FAVOURITES</Text>
              <Text style={styles.sectionTitle}>Popular near you</Text>
            </View>

            <TouchableOpacity
              onPress={() => openExplore()}
              style={styles.seeAll}
            >
              <Text style={styles.seeAllText}>View all</Text>
              <Text style={styles.seeAllArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.apiLoading}>
              <ActivityIndicator size="small" color={C.green} />
              <Text style={styles.apiLoadingText}>Loading venues...</Text>
            </View>
          ) : popularGrounds.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groundList}
            >
              {popularGrounds.map(item => {
                const image = getComplexImage(item);
                const itemSports = getComplexSports(item);
                const startingPrice = getStartingPrice(item);

                return (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.groundCard}
                    activeOpacity={0.9}
                    onPress={() => openGround(item._id)}
                  >
                    <View style={styles.groundImageWrap}>
                      {image ? (
                        <Image
                          source={{ uri: image }}
                          style={styles.groundImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.complexImageFallback}>
                          <Text style={styles.complexImageEmoji}>🏟️</Text>
                          <Text style={styles.complexImageText}>
                            SPORTS COMPLEX
                          </Text>
                        </View>
                      )}

                      <View style={styles.groundCategory}>
                        <Text
                          style={styles.groundCategoryText}
                          numberOfLines={1}
                        >
                          {itemSports.length
                            ? itemSports.slice(0, 2).join(' • ')
                            : 'Sports Venue'}
                        </Text>
                      </View>

                      {typeof item.rating === 'number' && (
                        <View style={styles.ratingPill}>
                          <Text style={styles.ratingStar}>★</Text>
                          <Text style={styles.ratingValue}>
                            {item.rating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.groundDetails}>
                      <Text style={styles.groundName} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <Text style={styles.groundLocation} numberOfLines={1}>
                        ⌖{' '}
                        {[item.address, item.city].filter(Boolean).join(', ') ||
                          'Location not available'}
                      </Text>

                      <View style={styles.groundCardFooter}>
                        <View>
                          <Text style={styles.priceLabel}>STARTING FROM</Text>

                          <Text style={styles.priceValue}>
                            {startingPrice !== null
                              ? `₹${startingPrice.toLocaleString('en-IN')}`
                              : 'View pricing'}

                            {startingPrice !== null && (
                              <Text style={styles.priceSuffix}> / slot</Text>
                            )}
                          </Text>
                        </View>

                        <View style={styles.cardArrow}>
                          <Text style={styles.cardArrowText}>↗</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {search ? 'No venues found' : 'No venues available'}
              </Text>

              <Text style={styles.emptySub}>
                {search
                  ? 'Try a different sport or location.'
                  : 'Active sports complexes will appear here.'}
              </Text>

              {!!search && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={styles.resetSearch}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* API Error */}
        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load some data</Text>

            <Text style={styles.errorMessage}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchHomeData}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Booking promise */}
        <View style={styles.promiseCard}>
          <View style={styles.promiseTop}>
            <View style={styles.promiseIcon}>
              <Text style={styles.promiseEmoji}>🏆</Text>
            </View>

            <View style={styles.promiseCopy}>
              <Text style={styles.promiseTitle}>
                Your next match is closer.
              </Text>
              <Text style={styles.promiseSub}>
                Choose a venue, pick its available slot and get ready to play.
              </Text>
            </View>
          </View>

          <View style={styles.promiseDivider} />

          <View style={styles.promiseFeatures}>
            <View style={styles.promiseFeature}>
              <Text style={styles.promiseFeatureIcon}>⚡</Text>
              <Text style={styles.promiseFeatureText}>Quick booking</Text>
            </View>

            <View style={styles.promiseFeature}>
              <Text style={styles.promiseFeatureIcon}>📍</Text>
              <Text style={styles.promiseFeatureText}>Nearby venues</Text>
            </View>

            <View style={styles.promiseFeature}>
              <Text style={styles.promiseFeatureIcon}>🕒</Text>
              <Text style={styles.promiseFeatureText}>Fixed time slots</Text>
            </View>
          </View>
        </View>

        {/* Bottom CTA */}
        <TouchableOpacity
          style={styles.bottomCta}
          activeOpacity={0.86}
          onPress={() => openExplore()}
        >
          <View style={styles.bottomCtaCopy}>
            <Text style={styles.bottomCtaEyebrow}>READY WHEN YOU ARE</Text>
            <Text style={styles.bottomCtaTitle}>Let's play?</Text>
          </View>

          <View style={styles.bottomCtaButton}>
            <Text style={styles.bottomCtaArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 0,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandMarkText: {
    color: C.lime,
    fontSize: 25,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  brandName: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandGreen: {
    color: C.green,
  },
  brandCaption: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginTop: 3,
  },
  avatarButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D6EBDD',
  },
  avatarText: {
    color: C.green,
    fontSize: 17,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#36C779',
    right: 3,
    top: 3,
    borderWidth: 1.5,
    borderColor: C.white,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  greetingCopy: {
    flex: 1,
  },
  eyebrow: {
    color: C.green,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  greeting: {
    color: C.ink,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  greetingSub: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: C.line,
    marginLeft: 8,
  },
  pin: {
    color: C.green,
    fontSize: 16,
    marginRight: 4,
  },
  locationText: {
    color: C.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  chevron: {
    color: C.muted,
    fontSize: 13,
    marginLeft: 5,
  },
  searchBox: {
    height: 54,
    backgroundColor: C.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 20,
  },
  searchGlyph: {
    color: C.green,
    fontSize: 27,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: C.ink,
    fontSize: 12,
    paddingVertical: 0,
  },
  clearText: {
    color: C.muted,
    fontSize: 16,
    paddingHorizontal: 8,
  },
  searchAction: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchActionText: {
    color: C.green,
    fontSize: 21,
    fontWeight: '800',
  },
  hero: {
    minHeight: 270,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: C.dark,
    paddingHorizontal: 21,
    paddingTop: 19,
    paddingBottom: 20,
  },
  heroDecorCircleLarge: {
    position: 'absolute',
    width: 205,
    height: 205,
    borderRadius: 103,
    right: -70,
    top: -82,
    backgroundColor: 'rgba(184, 243, 107, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(184, 243, 107, 0.13)',
  },
  heroDecorCircleSmall: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 63,
    right: 18,
    bottom: -76,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroSportIcon: {
    fontSize: 30,
    marginRight: 4,
  },
  heroTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(184, 243, 107, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(184, 243, 107, 0.35)',
  },
  heroTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.lime,
    marginRight: 7,
  },
  heroTagText: {
    color: C.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: C.white,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 24,
  },
  heroTitleAccent: {
    color: C.lime,
  },
  heroSub: {
    color: '#D7E4DC',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: '88%',
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.lime,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  heroMiniNote: {
    alignItems: 'flex-end',
    marginRight: 2,
  },
  heroMiniNoteTop: {
    color: '#B9CFC1',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroMiniNoteBottom: {
    color: C.white,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },
  heroButtonText: {
    color: C.dark,
    fontSize: 11,
    fontWeight: '900',
  },
  heroButtonArrow: {
    color: C.dark,
    fontSize: 17,
    fontWeight: '900',
    marginLeft: 13,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: 16,
    marginTop: 14,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: C.ink,
    fontSize: 19,
    fontWeight: '900',
  },
  metricLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },
  metricDivider: {
    height: 31,
    width: 1,
    backgroundColor: C.line,
  },
  section: {
    marginTop: 31,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionKicker: {
    color: C.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 3,
  },
  seeAllText: {
    color: C.green,
    fontSize: 11,
    fontWeight: '800',
  },
  seeAllArrow: {
    color: C.green,
    fontSize: 15,
    marginLeft: 5,
  },
  sportList: {
    paddingRight: 4,
  },
  sportTile: {
    width: 128,
    height: 145,
    borderRadius: 17,
    overflow: 'hidden',
    marginRight: 11,
    backgroundColor: '#DDE8DF',
  },
  sportImage: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 11,
    backgroundColor: '#315C43',
  },
  sportImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 20, 13, 0.35)',
  },
  sportEmoji: {
    fontSize: 26,
  },
  sportTileBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sportTileName: {
    color: C.white,
    fontSize: 13,
    fontWeight: '900',
  },
  sportTileArrow: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
  },
  groundList: {
    paddingRight: 5,
    paddingBottom: 4,
  },
  groundCard: {
    width: 258,
    backgroundColor: C.white,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 13,
    borderWidth: 1,
    borderColor: C.line,
  },
  groundImageWrap: {
    height: 148,
    backgroundColor: '#E4EAE5',
  },
  groundImage: {
    width: '100%',
    height: '100%',
  },
  groundCategory: {
    position: 'absolute',
    left: 11,
    top: 11,
    backgroundColor: 'rgba(16, 41, 30, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  groundCategoryText: {
    color: C.white,
    fontSize: 9,
    fontWeight: '800',
  },
  ratingPill: {
    position: 'absolute',
    right: 11,
    top: 11,
    backgroundColor: C.white,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    color: '#F5A623',
    fontSize: 11,
  },
  ratingValue: {
    color: C.ink,
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
  },
  groundDetails: {
    padding: 13,
  },
  groundName: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  groundLocation: {
    color: C.muted,
    fontSize: 10,
    marginTop: 7,
  },
  groundCardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.line,
    marginTop: 12,
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  priceValue: {
    color: C.ink,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  priceSuffix: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '600',
  },
  cardArrow: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowText: {
    color: C.green,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyState: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  emptySub: {
    color: C.muted,
    fontSize: 11,
    marginTop: 6,
  },
  resetSearch: {
    color: C.green,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 12,
  },
  promiseCard: {
    backgroundColor: C.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.line,
    padding: 16,
    marginTop: 30,
  },
  promiseTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promiseIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#F1F6DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promiseEmoji: {
    fontSize: 23,
  },
  promiseCopy: {
    flex: 1,
  },
  promiseTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  promiseSub: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  promiseDivider: {
    height: 1,
    backgroundColor: C.line,
    marginVertical: 15,
  },
  promiseFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  promiseFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promiseFeatureIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  promiseFeatureText: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  bottomCta: {
    backgroundColor: C.dark,
    borderRadius: 19,
    padding: 18,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomCtaCopy: {
    flex: 1,
  },
  bottomCtaEyebrow: {
    color: C.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  bottomCtaTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 5,
  },
  bottomCtaButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCtaArrow: {
    color: C.dark,
    fontSize: 23,
    fontWeight: '900',
  },
  bottomSpace: {
    height: 20,
  },
  apiLoading: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  apiLoadingText: {
    color: C.muted,
    fontSize: 11,
    marginTop: 9,
    fontWeight: '600',
  },
  complexImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDEBE1',
  },
  complexImageEmoji: {
    fontSize: 42,
  },
  complexImageText: {
    color: C.green,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 7,
  },
  errorCard: {
    backgroundColor: '#FFF2F0',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F4D3CF',
    padding: 15,
    marginTop: 20,
  },
  errorTitle: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '900',
  },
  errorMessage: {
    color: '#8C514B',
    fontSize: 11,
    marginTop: 6,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: C.green,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
    marginTop: 12,
  },
  retryButtonText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
  },
});

export default HomeScreen;
