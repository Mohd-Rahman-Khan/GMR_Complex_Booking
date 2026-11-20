import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenWrapper from '../../components/ScreenWrapper';
import { MainStackParamList } from '../../navigation/types';
import { apiRequest } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

type MasterSport = {
  _id: string;
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
};

type ComplexSport = {
  _id: string;
  masterSportId?: string;
  name: string;
  icon?: string;
  isActive?: boolean;
  slots?: {
    price?: number;
  }[];
  pricing?: any;
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
  rating?: number;
  openingTime?: string;
  closingTime?: string;
  isActive?: boolean;
  sports: ComplexSport[];
};

const C = {
  bg: '#F5F7F4',
  white: '#FFFFFF',
  ink: '#14251C',
  muted: '#7A887F',
  green: '#176B45',
  greenSoft: '#EAF3ED',
  lime: '#D9F36A',
  dark: '#10271C',
  line: '#E6ECE7',
  amber: '#F3A928',
};

const ExploreScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();

  const initialSportId = route.params?.sportId;

  const [selectedSport, setSelectedSport] = useState<string>(
    initialSportId || 'all',
  );

  const [search, setSearch] = useState('');
  const [sports, setSports] = useState<MasterSport[]>([]);
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedSport(initialSportId || 'all');
  }, [initialSportId]);

  const fetchExploreData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch master sports
      const sportsResponse: any = await apiRequest('/master-sports');

      const masterSports: MasterSport[] = sportsResponse?.data?.sports || [];

      setSports(masterSports);

      // 2. Fetch all active complexes
      const complexResponse: any = await apiRequest('/complexes');

      const allComplexes = complexResponse?.data?.complexes || [];

      // 3. Fetch sports of every complex
      const complexResults = await Promise.all(
        allComplexes.map(async (complex: any) => {
          try {
            const response: any = await apiRequest(
              `/sports/complex/${complex._id}`,
            );

            const complexSports: ComplexSport[] = response?.data?.sports || [];

            return {
              ...complex,
              sports: complexSports.filter(
                (sport: ComplexSport) => sport.isActive !== false,
              ),
            };
          } catch (err) {
            console.log(`Sports fetch failed for ${complex.name}:`, err);

            return {
              ...complex,
              sports: [],
            };
          }
        }),
      );

      setComplexes(
        complexResults.filter((item: Complex) => item.isActive !== false),
      );
    } catch (err: any) {
      console.log('Explore API error:', err);
      setError(err?.message || 'Unable to load complexes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExploreData();
  }, [fetchExploreData]);

  // Check whether complex has selected sport
  const hasSelectedSport = (complex: Complex, masterSport: MasterSport) => {
    return complex.sports?.some(sport => {
      const sameId = sport.masterSportId === masterSport._id;

      const sameName =
        sport.name?.trim().toLowerCase() ===
        masterSport.name?.trim().toLowerCase();

      return sameId || sameName;
    });
  };

  // Get minimum session price from complex sports
  const getStartingPrice = (complex: Complex) => {
    const prices: number[] = [];

    complex.sports?.forEach(sport => {
      sport.slots?.forEach(slot => {
        const price = Number(slot.price);

        if (Number.isFinite(price) && price > 0) {
          prices.push(price);
        }
      });

      // Support pricing as an array or object
      if (Array.isArray(sport.pricing)) {
        sport.pricing.forEach((item: any) => {
          const price = Number(item.price);

          if (Number.isFinite(price) && price > 0) {
            prices.push(price);
          }
        });
      } else if (sport.pricing && typeof sport.pricing === 'object') {
        const price = Number(sport.pricing.price);

        if (Number.isFinite(price) && price > 0) {
          prices.push(price);
        }
      }
    });

    return prices.length ? Math.min(...prices) : 0;
  };

  // Filter complexes
  const filteredGrounds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return complexes
      .filter(complex => {
        const matchesSport =
          selectedSport === 'all' ||
          sports.some(
            masterSport =>
              masterSport._id === selectedSport &&
              hasSelectedSport(complex, masterSport),
          );

        const complexSportsNames =
          complex.sports?.map(sport => sport.name).join(' ') || '';

        const matchesSearch =
          !query ||
          complex.name?.toLowerCase().includes(query) ||
          complex.address?.toLowerCase().includes(query) ||
          complex.city?.toLowerCase().includes(query) ||
          complexSportsNames.toLowerCase().includes(query);

        return matchesSport && matchesSearch;
      })
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [complexes, selectedSport, search, sports]);

  const selectedSportName =
    selectedSport === 'all'
      ? 'All playing fields'
      : sports.find(item => item._id === selectedSport)?.name ||
        'Selected sport';

  const resetFilters = () => {
    setSelectedSport('all');
    setSearch('');
  };

  const getComplexSportNames = (complex: Complex) => {
    return (
      complex.sports?.map(sport => sport.name).join(', ') ||
      'Sports information unavailable'
    );
  };

  const getComplexImage = (complex: Complex) => {
    return complex.image || complex.images?.[0] || '';
  };

  return (
    <ScreenWrapper style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* Editorial hero */}
        <View style={styles.hero}>
          <View style={styles.heroGlow} />

          <View style={styles.heroTopline}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>GMR</Text>
            </View>

            <Text style={styles.heroMark}>SA.</Text>
          </View>

          <Text style={styles.heroEyebrow}>FIND YOUR NEXT GAME</Text>
          <Text style={styles.heroTitle}>The perfect{'\n'}place to play.</Text>

          <Text style={styles.heroSubtitle}>
            Explore local venues, compare sessions{'\n'}and get your game on.
          </Text>

          <View style={styles.heroBottomRow}>
            <View>
              <Text style={styles.heroStatNumber}>
                {filteredGrounds.length.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.heroStatLabel}>MATCHING VENUES</Text>
            </View>

            <View style={styles.heroDecoration}>
              <Text style={styles.heroBall}>⚽</Text>
              <View style={styles.heroOrbit} />
            </View>
          </View>

          <View style={styles.heroStripe} />
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchIconCircle}>
            <Text style={styles.searchIcon}>⌕</Text>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search venue, sport or location"
            placeholderTextColor="#9AA69E"
            style={styles.searchInput}
            returnKeyType="search"
          />

          {!!search && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={10}
              style={styles.clearSearch}
            >
              <Text style={styles.clearSearchText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sport categories */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.eyebrow}>PICK YOUR GAME</Text>
            <Text style={styles.sectionTitle}>Explore by sport</Text>
          </View>

          <TouchableOpacity onPress={resetFilters} activeOpacity={0.7}>
            <Text style={styles.resetText}>Reset ↗</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportRail}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSelectedSport('all')}
            style={[
              styles.sportTile,
              selectedSport === 'all' && styles.sportTileActive,
            ]}
          >
            <View
              style={[
                styles.sportIconBox,
                selectedSport === 'all' && styles.sportIconBoxActive,
              ]}
            >
              <Text style={styles.sportIcon}>✦</Text>
            </View>

            <Text
              style={[
                styles.sportName,
                selectedSport === 'all' && styles.sportNameActive,
              ]}
            >
              All sports
            </Text>
          </TouchableOpacity>

          {sports.map(item => {
            const active = selectedSport === item._id;

            return (
              <TouchableOpacity
                key={item._id}
                activeOpacity={0.85}
                onPress={() => setSelectedSport(item._id)}
                style={[styles.sportTile, active && styles.sportTileActive]}
              >
                <View
                  style={[
                    styles.sportIconBox,
                    active && styles.sportIconBoxActive,
                  ]}
                >
                  <Text style={styles.sportIcon}>{item.icon || '🏅'}</Text>
                </View>

                <Text
                  style={[styles.sportName, active && styles.sportNameActive]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Result heading */}
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.eyebrow}>CURATED FOR YOUR GAME</Text>
            <Text style={styles.resultsTitle}>{selectedSportName}</Text>
          </View>

          <View style={styles.resultCount}>
            <Text style={styles.resultCountNumber}>
              {filteredGrounds.length}
            </Text>
            <Text style={styles.resultCountLabel}> venues</Text>
          </View>
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={styles.emptyTitle}>Finding venues...</Text>
            <Text style={styles.emptyDescription}>
              Please wait while we load sports complexes.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptyDescription}>{error}</Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={fetchExploreData}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredGrounds.length ? (
          <View style={styles.groundList}>
            {filteredGrounds.map((item, index) => {
              const image = getComplexImage(item);
              const startingPrice = getStartingPrice(item);

              return (
                <TouchableOpacity
                  key={item._id}
                  activeOpacity={0.92}
                  style={styles.groundCard}
                  onPress={() =>
                    navigation.navigate('GroundDetails', {
                      groundId: item._id,
                    })
                  }
                >
                  <View style={styles.imageWrap}>
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.groundImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.groundImageFallback}>
                        <Text style={styles.fallbackIcon}>🏟️</Text>
                        <Text style={styles.fallbackText}>GMR SPORTS</Text>
                      </View>
                    )}

                    <View style={styles.imageShade} />

                    <View style={styles.imageTopRow}>
                      <View style={styles.imageSportPill}>
                        <Text style={styles.imageSportText} numberOfLines={1}>
                          {getComplexSportNames(item)}
                        </Text>
                      </View>

                      <View style={styles.ratingPill}>
                        <Text style={styles.ratingStar}>★</Text>
                        <Text style={styles.ratingValue}>
                          {item.rating ? item.rating.toFixed(1) : 'New'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.imageBottomRow}>
                      <Text style={styles.imageIndex}>
                        VENUE {String(index + 1).padStart(2, '0')}
                      </Text>

                      <View style={styles.venueActivePill}>
                        <View style={styles.venueActiveDot} />
                        <Text style={styles.venueActiveText}>ACTIVE</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <View style={styles.cardTitleCopy}>
                        <Text style={styles.groundName} numberOfLines={1}>
                          {item.name}
                        </Text>

                        <Text style={styles.location} numberOfLines={1}>
                          ⌖{' '}
                          {[item.address, item.city]
                            .filter(Boolean)
                            .join(', ') || 'Location not available'}
                        </Text>
                      </View>

                      <View style={styles.openArrow}>
                        <Text style={styles.openArrowText}>↗</Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardFooter}>
                      <View style={styles.hoursMeta}>
                        <Text style={styles.hoursIcon}>◷</Text>

                        <View>
                          <Text style={styles.metaCaption}>OPENING HOURS</Text>

                          <Text style={styles.metaValue}>
                            {item.openingTime || '--:--'} –{' '}
                            {item.closingTime || '--:--'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.priceMeta}>
                        <Text style={styles.metaCaption}>SESSIONS FROM</Text>

                        <Text style={styles.priceValue}>
                          {startingPrice > 0
                            ? `₹${startingPrice.toLocaleString('en-IN')}`
                            : 'Check price'}
                          {startingPrice > 0 && (
                            <Text style={styles.priceUnit}> / slot</Text>
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>⌕</Text>
            </View>

            <Text style={styles.emptyTitle}>No complexes found</Text>

            <Text style={styles.emptyDescription}>
              Try a different keyword or choose another sport to discover more
              venues.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={resetFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyButtonText}>Clear all filters</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomNote}>
          <View style={styles.noteIconCircle}>
            <Text style={styles.noteIcon}>✦</Text>
          </View>

          <View style={styles.noteCopy}>
            <Text style={styles.noteTitle}>Every game has its place.</Text>

            <Text style={styles.noteText}>
              Session timings and prices are set individually by each venue.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 0 },
  content: { paddingBottom: 22 },
  hero: {
    backgroundColor: C.dark,
    minHeight: 292,
    paddingHorizontal: 22,
    paddingTop: 17,
    paddingBottom: 22,
    overflow: 'hidden',
    borderBottomLeftRadius: 27,
    borderBottomRightRadius: 27,
  },
  heroGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#1E4932',
    right: -90,
    top: 55,
    opacity: 0.72,
  },
  heroTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.lime,
    marginRight: 7,
  },
  liveText: {
    color: '#E2EDE5',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroMark: {
    color: C.lime,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroEyebrow: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginTop: 31,
  },
  heroTitle: {
    color: C.white,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1.1,
    marginTop: 9,
  },
  heroSubtitle: {
    color: '#C3D4C8',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 10,
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  heroStatNumber: { color: C.lime, fontSize: 25, fontWeight: '900' },
  heroStatLabel: {
    color: '#B5C9BA',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  heroDecoration: {
    width: 82,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBall: { fontSize: 43, zIndex: 1 },
  heroOrbit: {
    position: 'absolute',
    width: 76,
    height: 24,
    borderWidth: 1,
    borderColor: 'rgba(217,245,108,0.5)',
    borderRadius: 50,
    transform: [{ rotate: '-22deg' }],
    bottom: 5,
  },
  heroStripe: {
    position: 'absolute',
    height: 3,
    width: 75,
    backgroundColor: C.lime,
    bottom: 0,
    left: 22,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  searchWrap: {
    height: 58,
    backgroundColor: C.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.line,
    marginHorizontal: 18,
    marginTop: -1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#183323',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  searchIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: C.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  searchIcon: { color: C.green, fontSize: 23, lineHeight: 27 },
  searchInput: { flex: 1, color: C.ink, fontSize: 12, paddingVertical: 0 },
  clearSearch: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#F0F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: { color: C.muted, fontSize: 19, lineHeight: 21 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginHorizontal: 19,
    marginTop: 29,
    marginBottom: 14,
  },
  eyebrow: {
    color: C.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  resetText: {
    color: C.green,
    fontSize: 10,
    fontWeight: '900',
    paddingBottom: 3,
  },
  sportRail: { paddingHorizontal: 18, paddingBottom: 3 },
  sportTile: {
    width: 84,
    minHeight: 91,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  sportTileActive: { backgroundColor: C.dark, borderColor: C.dark },
  sportIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sportIconBoxActive: { backgroundColor: 'rgba(217,245,108,0.16)' },
  sportIcon: { fontSize: 19, color: C.green },
  sportName: {
    color: '#59675E',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  sportNameActive: { color: C.white },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginHorizontal: 19,
    marginTop: 29,
    marginBottom: 14,
  },
  resultsTitle: {
    color: C.ink,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  resultCount: {
    backgroundColor: C.greenSoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultCountNumber: { color: C.green, fontSize: 13, fontWeight: '900' },
  resultCountLabel: { color: C.green, fontSize: 9, fontWeight: '700' },
  groundList: { paddingHorizontal: 18, gap: 15 },
  groundCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  imageWrap: { height: 190, backgroundColor: '#DDE6DE' },
  groundImage: { width: '100%', height: '100%' },
  imageShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,25,16,0.16)',
  },
  imageTopRow: {
    position: 'absolute',
    top: 13,
    left: 13,
    right: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageSportPill: {
    backgroundColor: 'rgba(16,39,28,0.90)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  imageSportText: { color: C.white, fontSize: 9, fontWeight: '900' },
  ratingPill: {
    backgroundColor: C.white,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: { color: C.amber, fontSize: 12 },
  ratingValue: { color: C.ink, fontSize: 10, fontWeight: '900', marginLeft: 4 },
  imageBottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 13,
    right: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageIndex: {
    color: C.white,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  venueActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  venueActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#27A365',
    marginRight: 5,
  },
  venueActiveText: {
    color: C.green,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  cardBody: { paddingHorizontal: 15, paddingTop: 14, paddingBottom: 15 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitleCopy: { flex: 1, paddingRight: 10 },
  groundName: {
    color: C.ink,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  location: { color: C.muted, fontSize: 10, marginTop: 6 },
  openArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openArrowText: { color: C.green, fontSize: 19, fontWeight: '900' },
  cardDivider: { height: 1, backgroundColor: C.line, marginVertical: 14 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursMeta: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  hoursIcon: { fontSize: 18, color: C.green, marginRight: 8 },
  metaCaption: {
    color: C.muted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  metaValue: { color: C.ink, fontSize: 10, fontWeight: '800', marginTop: 4 },
  priceMeta: { alignItems: 'flex-end', paddingLeft: 8 },
  priceValue: { color: C.green, fontSize: 17, fontWeight: '900', marginTop: 3 },
  priceUnit: { color: C.muted, fontSize: 9, fontWeight: '600' },
  emptyState: {
    marginHorizontal: 18,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 35,
  },
  emptyIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: C.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: { color: C.green, fontSize: 30 },
  emptyTitle: { color: C.ink, fontSize: 17, fontWeight: '900', marginTop: 14 },
  emptyDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },
  emptyButton: {
    backgroundColor: C.dark,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 11,
    marginTop: 17,
  },
  emptyButtonText: { color: C.white, fontSize: 10, fontWeight: '900' },
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF3E9',
    borderRadius: 15,
    marginHorizontal: 18,
    marginTop: 20,
    padding: 13,
  },
  noteIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#DDEBD9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  noteIcon: { color: C.green, fontSize: 14 },
  noteCopy: { flex: 1 },
  noteTitle: { color: C.dark, fontSize: 10, fontWeight: '900' },
  noteText: { color: '#64766A', fontSize: 9, lineHeight: 14, marginTop: 3 },
  bottomSpace: { height: 15 },

  groundImageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#183B2A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallbackIcon: {
    fontSize: 42,
    marginBottom: 8,
  },

  fallbackText: {
    color: '#D9F36A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

export default ExploreScreen;
