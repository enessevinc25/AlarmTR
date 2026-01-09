/**
 * Report Issue Screen (P0)
 * 
 * Kullanıcıdan sorun bildirimi almak için ekran.
 * Diagnostic ve logları tek tuşla kopyalayabilir.
 */

import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Switch, Clipboard, Alert, Platform } from 'react-native';
import * as Application from 'expo-application';
import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAppTheme } from '../../theme/useAppTheme';
import { getRecentLogsText } from '../../utils/logger';
import { diagSummarize, getLastSessionId } from '../../services/alarmDiagnostics';

type IssueCategory = 'ALARM' | 'FAVORITES' | 'MAP' | 'OTHER';

const ReportIssueScreen = () => {
  const { colors, spacing, borderRadius } = useAppTheme();
  const [category, setCategory] = useState<IssueCategory>('ALARM');
  const [description, setDescription] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const categoryLabels: Record<IssueCategory, string> = {
    ALARM: 'Alarm',
    FAVORITES: 'Favoriler',
    MAP: 'Harita',
    OTHER: 'Diğer',
  };

  const handleCopyAndShare = async () => {
    if (!description.trim()) {
      Alert.alert('Uyarı', 'Lütfen sorun açıklaması girin.');
      return;
    }

    setIsGenerating(true);

    try {
      const lines: string[] = [];
      lines.push('=== SORUN BİLDİRİMİ ===');
      lines.push('');
      lines.push(`Kategori: ${categoryLabels[category]}`);
      lines.push(`Açıklama: ${description}`);
      lines.push('');
      lines.push(`App Version: ${Application.nativeApplicationVersion || 'unknown'}`);
      lines.push(`Build: ${Application.nativeBuildVersion || 'unknown'}`);
      lines.push(`Platform: ${Platform.OS} ${Platform.Version}`);
      lines.push('');

      // Son alarm diagnostiği
      if (includeDiagnostics) {
        try {
          const lastSessionId = await getLastSessionId();
          if (lastSessionId) {
            const summary = await diagSummarize(lastSessionId);
            lines.push('=== SON ALARM DİAGNOSTİĞİ ===');
            lines.push(summary);
            lines.push('');
          } else {
            lines.push('=== SON ALARM DİAGNOSTİĞİ ===');
            lines.push('Son alarm diagnostiği bulunamadı.');
            lines.push('');
          }
        } catch (error) {
          lines.push('=== SON ALARM DİAGNOSTİĞİ ===');
          lines.push(`Diagnostic okuma hatası: ${error instanceof Error ? error.message : String(error)}`);
          lines.push('');
        }
      }

      // Son loglar
      if (includeLogs) {
        try {
          const logs = await getRecentLogsText();
          lines.push('=== SON UYGULAMA LOGLARI ===');
          lines.push(logs);
        } catch (error) {
          lines.push('=== SON UYGULAMA LOGLARI ===');
          lines.push(`Log okuma hatası: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const text = lines.join('\n');
      await Clipboard.setString(text);

      Alert.alert('Başarılı', 'Sorun bildirimi panoya kopyalandı. Lütfen destek ekibine gönderin.');
    } catch (error) {
      Alert.alert('Hata', 'Sorun bildirimi oluşturulamadı. Lütfen tekrar deneyin.');
      if (__DEV__) {
        console.warn('[ReportIssue] Failed to generate report:', error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.sm }}>
            Sorun Bildir
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20 }}>
            Karşılaştığınız sorunu açıklayın. Gerekirse diagnostic ve log bilgilerini ekleyebilirsiniz.
          </Text>
        </View>

        {/* Kategori */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
            Kategori
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {(Object.keys(categoryLabels) as IssueCategory[]).map((cat) => (
              <PrimaryButton
                key={cat}
                title={categoryLabels[cat]}
                onPress={() => setCategory(cat)}
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: category === cat ? colors.primary : colors.border,
                }}
                textStyle={{
                  color: category === cat ? colors.white : colors.text,
                }}
              />
            ))}
          </View>
        </View>

        {/* Açıklama */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm }}>
            Sorun Açıklaması
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Sorunu kısaca açıklayın..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={6}
            style={{
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              color: colors.text,
              fontSize: 16,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Toggle'lar */}
        <View style={{ marginBottom: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                Son Alarm Diagnostiğini Ekle
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                Son alarm oturumunun teknik bilgilerini ekler
              </Text>
            </View>
            <Switch
              value={includeDiagnostics}
              onValueChange={setIncludeDiagnostics}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                Son Uygulama Loglarını Ekle
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                Son 50 uygulama logunu ekler
              </Text>
            </View>
            <Switch
              value={includeLogs}
              onValueChange={setIncludeLogs}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Buton */}
        <PrimaryButton
          title={isGenerating ? 'Oluşturuluyor...' : 'Kopyala ve Paylaş'}
          onPress={handleCopyAndShare}
          disabled={isGenerating || !description.trim()}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

export default ReportIssueScreen;
