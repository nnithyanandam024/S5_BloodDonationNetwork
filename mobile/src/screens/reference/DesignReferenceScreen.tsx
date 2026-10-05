import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Icon } from '../../components/Icon/Icon';
import Svg, { Rect, Path, G, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// High-fidelity SVG QR Code component for the ID Card
const SvgQRCode = ({ size = 80, color = '#FFFFFF' }: { size?: number; color?: string }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer Corners */}
      <Rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke={color} strokeWidth="6" />
      <Rect x="14" y="14" width="12" height="12" rx="2" fill={color} />
      <Rect x="65" y="5" width="30" height="30" rx="4" fill="none" stroke={color} strokeWidth="6" />
      <Rect x="74" y="14" width="12" height="12" rx="2" fill={color} />
      <Rect x="5" y="65" width="30" height="30" rx="4" fill="none" stroke={color} strokeWidth="6" />
      <Rect x="14" y="74" width="12" height="12" rx="2" fill={color} />

      {/* Internal QR Data Matrix Dots */}
      <Rect x="42" y="10" width="8" height="8" rx="2" fill={color} />
      <Rect x="52" y="18" width="6" height="6" rx="1.5" fill={color} />
      <Rect x="42" y="26" width="8" height="8" rx="2" fill={color} />
      <Rect x="12" y="44" width="8" height="8" rx="2" fill={color} />
      <Rect x="26" y="44" width="6" height="6" rx="1.5" fill={color} />
      <Rect x="42" y="42" width="16" height="16" rx="3" fill={color} />
      <Rect x="64" y="42" width="10" height="8" rx="2" fill={color} />
      <Rect x="80" y="44" width="12" height="6" rx="1.5" fill={color} />
      <Rect x="44" y="66" width="8" height="12" rx="2" fill={color} />
      <Rect x="58" y="64" width="12" height="8" rx="2" fill={color} />
      <Rect x="76" y="62" width="16" height="12" rx="3" fill={color} />
      <Rect x="54" y="80" width="10" height="12" rx="2" fill={color} />
      <Rect x="70" y="82" width="8" height="10" rx="2" fill={color} />
      <Rect x="84" y="80" width="8" height="12" rx="2" fill={color} />
    </Svg>
  );
};

// Progress Ring around user avatar
const AvatarProgressRing = ({ percentage = 60, size = 46 }: { percentage?: number; size?: number }) => {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 46 46">
        <Circle cx="23" cy="23" r="21" stroke="#E5E7EB" strokeWidth="2.5" fill="none" />
        <Circle
          cx="23"
          cy="23"
          r="21"
          stroke="#7047EB"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="132"
          strokeDashoffset={132 - (132 * percentage) / 100}
          strokeLinecap="round"
          transform="rotate(-90 23 23)"
        />
      </Svg>
      <View style={styles.avatarInner}>
        <Text style={styles.avatarLetter}>T</Text>
      </View>
      <View style={styles.progressBadge}>
        <Text style={styles.progressBadgeText}>{percentage}%</Text>
      </View>
    </View>
  );
};

export const DesignReferenceScreen = ({ navigation }: any) => {
  // Screen selector: 0 = Screen 1 (Home), 1 = Screen 2 (Instant Services), 2 = Screen 3 (Buying Insurance / ID)
  const [activeScreenIndex, setActiveScreenIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'Home' | 'Policies' | 'Benefits' | 'Buy'>('Home');

  // RENDER SCREEN 1: HOME
  const renderScreen1 = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Top Header */}
      <View style={styles.screenHeader}>
        <View style={styles.headerLeft}>
          <AvatarProgressRing percentage={60} />
          <View style={styles.headerTexts}>
            <Text style={styles.greetingTitle}>Hello  Thomson!</Text>
            <Text style={styles.greetingSubtitle}>Complete your profile easily</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.iconCircleBtn}>
          <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
          <View style={styles.redDotBadge} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={19} color="#9CA3AF" strokeWidth={2} />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          editable={false}
        />
        <TouchableOpacity activeOpacity={0.7} style={styles.filterBtn}>
          <Icon name="filter" size={17} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Featured Purple Hero Card */}
      <View style={styles.purpleHeroCard}>
        {/* Subtle decorative background waves */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIconSquircle}>
            <Icon name="car" size={22} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View style={styles.cardTitleBox}>
            <Text style={styles.cardMainTitle}>Car Insurance</Text>
            <Text style={styles.cardSubTitle}>Comprehensive</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.cardCornerBtn}>
            <Icon name="arrow-up-right" size={16} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Card Details Row */}
        <View style={styles.cardDetailsRow}>
          <View style={styles.cardDetailCol}>
            <Text style={styles.cardDetailLabel}>Policy holder</Text>
            <Text style={styles.cardDetailValue}>Rahul Sharma</Text>
          </View>
          <View style={[styles.cardDetailCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.cardDetailLabel}>Tata Altroz</Text>
            <Text style={styles.cardDetailValue}>MP04CY9999</Text>
          </View>
        </View>

        {/* Card Bottom Row */}
        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.cardDetailLabel}>Third party validity</Text>
            <Text style={styles.cardDateValue}>10/02/25</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.darkPillBtn}>
            <Text style={styles.darkPillBtnText}>Renew Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Health & Wellness Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Health & Wellness</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* 4 Category Squircles */}
      <View style={styles.categoriesRow}>
        {/* Category 1: Health (Pink) */}
        <TouchableOpacity activeOpacity={0.8} style={styles.categoryItem}>
          <View style={[styles.categorySquircle, { backgroundColor: '#FDECEF' }]}>
            <Icon name="heart" size={22} color="#E11D48" strokeWidth={2} />
          </View>
          <Text style={styles.categoryLabel}>Health</Text>
        </TouchableOpacity>

        {/* Category 2: Bike (Peach) */}
        <TouchableOpacity activeOpacity={0.8} style={styles.categoryItem}>
          <View style={[styles.categorySquircle, { backgroundColor: '#FFF2E8' }]}>
            <Icon name="bike" size={22} color="#F97316" strokeWidth={2} />
          </View>
          <Text style={styles.categoryLabel}>Bike</Text>
        </TouchableOpacity>

        {/* Category 3: Home (Lavender) */}
        <TouchableOpacity activeOpacity={0.8} style={styles.categoryItem}>
          <View style={[styles.categorySquircle, { backgroundColor: '#F1ECFE' }]}>
            <Icon name="home" size={22} color="#7C3AED" strokeWidth={2} />
          </View>
          <Text style={styles.categoryLabel}>Home</Text>
        </TouchableOpacity>

        {/* Category 4: Travel (Cyan) */}
        <TouchableOpacity activeOpacity={0.8} style={styles.categoryItem}>
          <View style={[styles.categorySquircle, { backgroundColor: '#E2F6FC' }]}>
            <Icon name="suitcase" size={22} color="#0284C7" strokeWidth={2} />
          </View>
          <Text style={styles.categoryLabel}>Travel</Text>
        </TouchableOpacity>
      </View>

      {/* Dot Indicators */}
      <View style={styles.dotIndicatorsRow}>
        <View style={styles.activeDotPill} />
        <View style={styles.inactiveDot} />
        <View style={styles.inactiveDot} />
      </View>

      {/* Quick Actions Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Item 1 */}
      <TouchableOpacity activeOpacity={0.8} style={styles.quickActionCard}>
        <View style={[styles.quickActionIconBox, { backgroundColor: '#FFF2E8' }]}>
          <Icon name="clipboard" size={20} color="#F97316" strokeWidth={2} />
        </View>
        <View style={styles.quickActionTextBox}>
          <Text style={styles.quickActionTitle}>Register a Claim</Text>
          <Text style={styles.quickActionSub}>Weekly Goal: 150 min</Text>
        </View>
        <Text style={styles.quickActionAmount}>+$234.00</Text>
      </TouchableOpacity>

      {/* Quick Action Item 2 */}
      <TouchableOpacity activeOpacity={0.8} style={styles.quickActionCard}>
        <View style={[styles.quickActionIconBox, { backgroundColor: '#F1ECFE' }]}>
          <Icon name="location-pin" size={20} color="#7C3AED" strokeWidth={2} />
        </View>
        <View style={styles.quickActionTextBox}>
          <Text style={styles.quickActionTitle}>Find Local Services</Text>
          <Text style={styles.quickActionSub}>Weekly Goal: 15 min</Text>
        </View>
        <Text style={styles.quickActionAmount}>+$134.00</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // RENDER SCREEN 2: INSTANT SERVICES
  const renderScreen2 = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Top Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconCircleBtn}
          onPress={() => setActiveScreenIndex(0)}
        >
          <Icon name="arrow-left" size={18} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.screenCenterTitle}>Instant Services</Text>
        <TouchableOpacity activeOpacity={0.8} style={styles.iconCircleBtn}>
          <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
          <View style={styles.redDotBadge} />
        </TouchableOpacity>
      </View>

      {/* Live Well & Yield Rewards Section */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.md, marginBottom: spacing.md }]}>
        Live Well & Yield Rewards
      </Text>

      {/* Row with 2 cards */}
      <View style={styles.rewardsRow}>
        {/* Left Card: Our Agents */}
        <View style={styles.agentsCard}>
          <View style={styles.starBadgeRow}>
            <View style={styles.starIconBox}>
              <Icon name="star" size={14} color="#F59E0B" strokeWidth={2} />
            </View>
            <Text style={styles.agentsCardTitle}>Our Agents</Text>
          </View>
          <Text style={styles.agentsCardSubtitle}>
            Meet your exclusive insurance advisor and get advice
          </Text>

          {/* Overlapping circular avatars */}
          <View style={styles.avatarStackRow}>
            <View style={[styles.stackAvatar, { backgroundColor: '#FDE68A', zIndex: 4 }]}>
              <Text style={styles.stackAvatarText}>A</Text>
            </View>
            <View style={[styles.stackAvatar, { backgroundColor: '#FED7AA', zIndex: 3, marginLeft: -12 }]}>
              <Text style={styles.stackAvatarText}>M</Text>
            </View>
            <View style={[styles.stackAvatar, { backgroundColor: '#DDD6FE', zIndex: 2, marginLeft: -12 }]}>
              <Text style={styles.stackAvatarText}>S</Text>
            </View>
            <View style={[styles.stackAvatarBadge, { zIndex: 1, marginLeft: -12 }]}>
              <Text style={styles.stackAvatarBadgeText}>+20</Text>
            </View>
          </View>
        </View>

        {/* Right Card: Chat with expert */}
        <View style={styles.expertCard}>
          <View style={styles.expertChatIconBox}>
            <Icon name="chat" size={20} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.expertCardTitle}>Chat with</Text>
          <Text style={styles.expertCardTitle}>expert</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.messageNowBtn}>
            <Text style={styles.messageNowText}>Message Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions Header */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg }]}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Action Card 1: Edit Your Policy Details */}
      <View style={styles.detailedActionCard}>
        <View style={styles.detailedTagRow}>
          <View style={styles.pillChipOrange}>
            <Icon name="heart" size={12} color="#EA580C" strokeWidth={2} />
            <Text style={styles.pillChipOrangeText}>Health</Text>
          </View>
        </View>

        <Text style={styles.detailedActionTitle}>Edit Your Policy Details</Text>
        <Text style={styles.detailedActionSubtitle}>
          Your policy purchased on 27 Feb, 2025 will{'\n'}
          <Text style={styles.expireHighlight}>Expires In 15 Days</Text>
        </Text>

        <TouchableOpacity activeOpacity={0.85} style={styles.renewActionPill}>
          <View style={styles.renewPillInner}>
            <Icon name="refresh" size={15} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.renewPillText}>Renew Now</Text>
            <Icon name="chevron-right" size={16} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Card 2: Register a Claim Details */}
      <View style={styles.detailedActionCard}>
        <View style={styles.detailedTagRow}>
          <View style={styles.pillChipPink}>
            <Icon name="clipboard" size={12} color="#E11D48" strokeWidth={2} />
            <Text style={styles.pillChipPinkText}>PUC Validity</Text>
          </View>
        </View>

        <Text style={styles.detailedActionTitle}>Register a Claim Details</Text>
        <Text style={styles.detailedActionSubtitle}>
          Your policy purchased on 27 Feb, 2025 will...
        </Text>
      </View>
    </ScrollView>
  );

  // RENDER SCREEN 3: BUYING INSURANCE / ID CARD
  const renderScreen3 = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Top Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconCircleBtn}
          onPress={() => setActiveScreenIndex(1)}
        >
          <Icon name="arrow-left" size={18} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.screenCenterTitle}>Buying Insurance</Text>
        <TouchableOpacity activeOpacity={0.8} style={styles.iconCircleBtn}>
          <Icon name="bell" size={20} color="#1F2937" strokeWidth={1.8} />
          <View style={styles.redDotBadge} />
        </TouchableOpacity>
      </View>

      {/* Alex Mandes Profile Banner */}
      <View style={styles.profileBannerRow}>
        <View style={styles.profileLeftBox}>
          <Text style={styles.profileName}>Alex</Text>
          <Text style={styles.profileName}>Mandes</Text>
          <Text style={styles.profileDob}>24 Feb 2001</Text>

          {/* Overlapping small avatar chips */}
          <View style={styles.profileAvatarRow}>
            <View style={[styles.miniAvatar, { backgroundColor: '#C7D2FE', zIndex: 4 }]}>
              <Text style={styles.miniAvatarText}>A</Text>
            </View>
            <View style={[styles.miniAvatar, { backgroundColor: '#FDE68A', zIndex: 3, marginLeft: -8 }]}>
              <Text style={styles.miniAvatarText}>B</Text>
            </View>
            <View style={[styles.miniAvatar, { backgroundColor: '#A7F3D0', zIndex: 2, marginLeft: -8 }]}>
              <Text style={styles.miniAvatarText}>C</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={[styles.miniAddBtn, { zIndex: 1, marginLeft: -8 }]}>
              <Icon name="plus" size={12} color="#4B5563" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Photo Placeholder & Geometric Rings */}
        <View style={styles.profileRightBox}>
          <View style={styles.ringsBadge}>
            <Svg width={38} height={20} viewBox="0 0 38 20">
              <Circle cx="10" cy="10" r="9" stroke="#9CA3AF" strokeWidth="1.5" fill="none" opacity={0.6} />
              <Circle cx="24" cy="10" r="9" stroke="#9CA3AF" strokeWidth="1.5" fill="none" opacity={0.6} />
            </Svg>
            <Text style={styles.ringsText}>11.12.22 (3 yr)</Text>
          </View>
          <View style={styles.personPhotoMock}>
            <Icon name="user" size={48} color="#7047EB" strokeWidth={1.5} />
          </View>
        </View>
      </View>

      {/* Signature Purple Digital ID Card with QR Code */}
      <View style={styles.purpleIdCard}>
        {/* Top Pills Row */}
        <View style={styles.idCardPillsRow}>
          <View style={styles.idCardPill}>
            <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.idCardPill}>
            <Icon name="anchor" size={14} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View style={styles.idCardPill}>
            <Icon name="dots-horizontal" size={14} color="#FFFFFF" />
          </View>
        </View>

        {/* Card Content & QR Code Row */}
        <View style={styles.idCardBodyRow}>
          <View style={styles.idCardInfoLeft}>
            <Text style={styles.idCardLabelTag}>Personality Data</Text>
            <Text style={styles.idCardHeaderTitle}>ID Card</Text>

            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.idSubLabel}>ID Number</Text>
              <Text style={styles.idSubVal}>326547624</Text>

              <Text style={[styles.idSubLabel, { marginTop: 6 }]}>Policy Number</Text>
              <Text style={styles.idSubVal}>CA326547624</Text>

              <Text style={[styles.idSubLabel, { marginTop: 6 }]}>Residence</Text>
              <Text style={styles.idSubVal}>California, USA</Text>
            </View>
          </View>

          {/* Clean High-Res QR Code */}
          <View style={styles.qrContainer}>
            <SvgQRCode size={84} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Buy Insurance Section */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg }]}>
        <Text style={styles.sectionTitle}>Buy Insurance</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Two Plan Cards: Dark & Light */}
      <View style={styles.buyPlansRow}>
        {/* Dark Card: Health Insurance */}
        <View style={styles.darkPlanCard}>
          <View style={styles.planCardTop}>
            <View style={styles.darkPlanIconSquircle}>
              <Icon name="heart" size={16} color="#FFFFFF" strokeWidth={2} />
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.planArrowBtnDark}>
              <Icon name="arrow-up-right" size={14} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={styles.darkPlanName}>Health Insurance</Text>
          <Text style={styles.darkPlanPrice}>$214</Text>
        </View>

        {/* Light Card: Bike Insurance */}
        <View style={styles.lightPlanCard}>
          <View style={styles.planCardTop}>
            <View style={styles.lightPlanIconSquircle}>
              <Icon name="bike" size={16} color="#374151" strokeWidth={2} />
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.planArrowBtnLight}>
              <Icon name="arrow-up-right" size={14} color="#4B5563" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={styles.lightPlanName}>Bike Insurance</Text>
          <Text style={styles.lightPlanPrice}>$112</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* Top Interactive Screen Switcher Bar (lets user navigate all 3 screens from the design!) */}
      <View style={styles.screenSwitcherBar}>
        <TouchableOpacity
          onPress={() => setActiveScreenIndex(0)}
          style={[styles.switcherTab, activeScreenIndex === 0 && styles.switcherTabActive]}
        >
          <Text style={[styles.switcherText, activeScreenIndex === 0 && styles.switcherTextActive]}>
            1. Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveScreenIndex(1)}
          style={[styles.switcherTab, activeScreenIndex === 1 && styles.switcherTabActive]}
        >
          <Text style={[styles.switcherText, activeScreenIndex === 1 && styles.switcherTextActive]}>
            2. Services
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveScreenIndex(2)}
          style={[styles.switcherTab, activeScreenIndex === 2 && styles.switcherTabActive]}
        >
          <Text style={[styles.switcherText, activeScreenIndex === 2 && styles.switcherTextActive]}>
            3. ID Card
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main View Area */}
      <View style={styles.contentArea}>
        {activeScreenIndex === 0 && renderScreen1()}
        {activeScreenIndex === 1 && renderScreen2()}
        {activeScreenIndex === 2 && renderScreen3()}
      </View>

      {/* Custom Signature Curved Bottom Navigation Bar with Elevated Center '+' */}
      <View style={styles.curvedTabBar}>
        {/* Tab 1: Home */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('Home');
            setActiveScreenIndex(0);
          }}
          style={styles.tabItem}
        >
          <Icon
            name="home"
            size={22}
            color={activeTab === 'Home' ? colors.violetPrimary : '#9CA3AF'}
            strokeWidth={2.2}
          />
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
          {activeTab === 'Home' && <View style={styles.activeDotUnderline} />}
        </TouchableOpacity>

        {/* Tab 2: Policies */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('Policies');
            setActiveScreenIndex(1);
          }}
          style={styles.tabItem}
        >
          <Icon
            name="shield"
            size={22}
            color={activeTab === 'Policies' ? colors.violetPrimary : '#9CA3AF'}
            strokeWidth={2}
          />
          <Text style={[styles.tabLabel, activeTab === 'Policies' && styles.tabLabelActive]}>
            Policies
          </Text>
          {activeTab === 'Policies' && <View style={styles.activeDotUnderline} />}
        </TouchableOpacity>

        {/* Center Elevated Purple Plus Button */}
        <View style={styles.centerFabContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setActiveScreenIndex(1);
            }}
            style={styles.centerFabBtn}
          >
            <Icon name="plus" size={24} color="#FFFFFF" strokeWidth={2.8} />
          </TouchableOpacity>
        </View>

        {/* Tab 3: Benefits */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('Benefits');
            setActiveScreenIndex(2);
          }}
          style={styles.tabItem}
        >
          <Icon
            name="sparkles"
            size={22}
            color={activeTab === 'Benefits' ? colors.violetPrimary : '#9CA3AF'}
            strokeWidth={2}
          />
          <Text style={[styles.tabLabel, activeTab === 'Benefits' && styles.tabLabelActive]}>
            Benefits
          </Text>
          {activeTab === 'Benefits' && <View style={styles.activeDotUnderline} />}
        </TouchableOpacity>

        {/* Tab 4: Buy */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('Buy');
            setActiveScreenIndex(2);
          }}
          style={styles.tabItem}
        >
          <Icon
            name="cart"
            size={22}
            color={activeTab === 'Buy' ? colors.violetPrimary : '#9CA3AF'}
            strokeWidth={2}
          />
          <Text style={[styles.tabLabel, activeTab === 'Buy' && styles.tabLabelActive]}>Buy</Text>
          {activeTab === 'Buy' && <View style={styles.activeDotUnderline} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  screenSwitcherBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'space-around',
  },
  switcherTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  switcherTabActive: {
    backgroundColor: '#7047EB',
  },
  switcherText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  switcherTextActive: {
    color: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7047EB',
  },
  progressBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#7047EB',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  progressBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerTexts: {
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  greetingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  redDotBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  screenCenterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  filterBtn: {
    padding: 6,
  },

  // Purple Hero Card
  purpleHeroCard: {
    backgroundColor: '#7047EB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardMainTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cardCornerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardDetailCol: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  cardDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 14,
  },
  cardDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  darkPillBtn: {
    backgroundColor: '#151622',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  darkPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Health & Wellness Categories
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7047EB',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categorySquircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  dotIndicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  activeDotPill: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7047EB',
  },
  inactiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },

  // Quick Actions List
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickActionTextBox: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  quickActionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  quickActionAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  // Screen 2: Instant Services Styles
  rewardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  agentsCard: {
    flex: 1.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  starBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  starIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentsCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  agentsCardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  stackAvatarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  expertCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  expertChatIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7047EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  expertCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  messageNowBtn: {
    marginTop: 10,
  },
  messageNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7047EB',
  },

  detailedActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  detailedTagRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  pillChipOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF2E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillChipOrangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EA580C',
  },
  pillChipPink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDECEF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillChipPinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E11D48',
  },
  detailedActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  detailedActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  expireHighlight: {
    color: '#EF4444',
    fontWeight: '600',
  },
  renewActionPill: {
    backgroundColor: '#151622',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  renewPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renewPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Screen 3: Buying Insurance & ID Card Styles
  profileBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  profileLeftBox: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 26,
  },
  profileDob: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  miniAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRightBox: {
    alignItems: 'flex-end',
  },
  ringsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ringsText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  personPhotoMock: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  purpleIdCard: {
    backgroundColor: '#7047EB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  idCardPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  idCardPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idCardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  idCardInfoLeft: {
    flex: 1,
  },
  idCardLabelTag: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  idCardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  idSubLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  idSubVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  qrContainer: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
  },

  // Buy Plans Row
  buyPlansRow: {
    flexDirection: 'row',
    gap: 12,
  },
  darkPlanCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
  },
  lightPlanCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  darkPlanIconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightPlanIconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planArrowBtnDark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planArrowBtnLight: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkPlanName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  darkPlanPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lightPlanName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  lightPlanPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  // Signature Curved Bottom Tab Bar with Center Elevated Floating Button
  curvedTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#7047EB',
    fontWeight: '700',
  },
  activeDotUnderline: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7047EB',
    marginTop: 3,
  },
  centerFabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  centerFabBtn: {
    position: 'absolute',
    top: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7047EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#7047EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
