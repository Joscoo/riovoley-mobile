import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { fonts } from '@/shared/theme';
import { EmptyState, LoadingState, ThemedText, ThemedView } from '@/shared/components';
import { supabase } from '@/lib/supabase';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { canAccessAthletes } from '@/shared/navigation/roleTabs';

type AthleteRecord = Record<string, unknown> & {
  id?: string | number;
  user_id?: string | number;
  student_id?: string | number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  category?: string;
  role?: string;
  status?: string;
  avatar_url?: string;
  photo_url?: string;
  image_url?: string;
  _rowKey: string;
  _sourceTable: string;
};

const TABLE_CANDIDATES = ['students', 'athletes', 'user_profiles'] as const;
const IGNORED_DETAIL_KEYS = new Set([
  'id',
  'user_id',
  'student_id',
  'created_at',
  'updated_at',
  'deleted_at',
  'avatar_url',
  'photo_url',
  'image_url',
  '_rowKey',
  '_sourceTable',
]);

function formatLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) {
    return 'â€”';
  }

  if (typeof value === 'boolean') {
    return value ? 'SÃ­' : 'No';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatValue).join(', ') : 'â€”';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  const text = String(value).trim();
  return text.length > 0 ? text : 'â€”';
}

function getDisplayName(row: AthleteRecord) {
  const fullName = formatValue(row.full_name);
  if (fullName !== 'â€”') {
    return fullName;
  }

  const composedName = [row.first_name, row.last_name]
    .map(formatValue)
    .filter((part) => part !== 'â€”')
    .join(' ')
    .trim();

  if (composedName) {
    return composedName;
  }

  const directName = [row.name, row.email]
    .map(formatValue)
    .find((value) => value !== 'â€”');

  return directName ?? 'Nombre no disponible';
}

function getSummary(row: AthleteRecord) {
  const summaryCandidates = [row.category, row.role, row.status, row.email]
    .map(formatValue)
    .filter((value) => value !== 'â€”');

  return summaryCandidates[0] ?? 'Sin categorÃ­a';
}

function getAvatarUri(row: AthleteRecord) {
  const candidates = [row.avatar_url, row.photo_url, row.image_url]
    .map(formatValue)
    .filter((value) => value !== 'â€”');

  return candidates[0] ?? null;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function normalizeStudentWithUser(student: any): Record<string, unknown> {
  const { user, ...studentData } = student;
  
  // Construir nombre completo desde users
  const fullName = user 
    ? `${user.nombre || ''} ${user.apellido || ''}`.trim() 
    : undefined;
  
  return {
    ...studentData,
    full_name: fullName || undefined,
    first_name: user?.nombre,
    last_name: user?.apellido,
    email: user?.email || studentData.email,
    category: studentData.categoria, // Mapear categoria de students
  };
}

function normalizeRows(rows: Record<string, unknown>[], sourceTable: string): AthleteRecord[] {
  return rows.map((row, index) => {
    const rawId = row.id ?? row.user_id ?? row.student_id ?? `${sourceTable}-${index}`;
    const rowKey = `${sourceTable}-${String(rawId)}`;

    return {
      ...row,
      _rowKey: rowKey,
      _sourceTable: sourceTable,
    };
  }) as AthleteRecord[];
}

function AthleteCard({ item }: { item: AthleteRecord }) {
  const displayName = getDisplayName(item);
  const summary = getSummary(item);
  const avatarUri = getAvatarUri(item);
  const initials = getInitials(displayName);
  const details = Object.entries(item).filter(
    ([key, value]) => !IGNORED_DETAIL_KEYS.has(key) && value !== null && value !== undefined && String(value).trim() !== '',
  );

  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <ThemedText style={styles.avatarText}>{initials || 'RV'}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.headerCopy}>
          <ThemedText style={styles.cardTitle}>{displayName}</ThemedText>
          <ThemedText style={styles.cardSubtitle}>{summary}</ThemedText>
        </View>

        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{item._sourceTable}</ThemedText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <MetaPill label="Campos" value={String(details.length)} />
        <MetaPill label="ID" value={String(item.id ?? item.user_id ?? item.student_id ?? 'N/A')} />
      </View>

      <View style={styles.detailsGrid}>
        {details.map(([key, value]) => (
          <View key={key} style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>{formatLabel(key)}</ThemedText>
            <ThemedText style={styles.detailValue}>{formatValue(value)}</ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <ThemedText style={styles.metaLabel}>{label}</ThemedText>
      <ThemedText style={styles.metaValue}>{value}</ThemedText>
    </View>
  );
}

export default function AthletesScreen() {
  const { loading: roleLoading, role } = useSessionRole();
  const [athletes, setAthletes] = useState<AthleteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceTable, setSourceTable] = useState<string | null>(null);

  const loadAthletes = useCallback(async () => {
    setError(null);
    setRefreshing(true);

    let nextRows: AthleteRecord[] = [];
    let nextSource: string | null = null;
    let lastError: string | null = null;

    for (const tableName of TABLE_CANDIDATES) {
      let queryData: any[] | null = null;
      let queryError: any = null;

      // Para students, hacer JOIN con users para obtener nombre completo
      if (tableName === 'students') {
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            user:users!user_id (
              nombre,
              apellido,
              email
            )
          `);
        
        // Normalizar datos de JOIN
        queryData = data ? data.map(normalizeStudentWithUser) : null;
        queryError = error;
      } else {
        // Mantener consulta normal para otras tablas
        const { data, error } = await supabase.from(tableName).select('*');
        queryData = data;
        queryError = error;
      }

      if (queryError) {
        lastError = queryError.message;
        continue;
      }

      const normalized = normalizeRows((queryData ?? []) as Record<string, unknown>[], tableName);
      if (normalized.length === 0) {
        continue;
      }

      nextRows = normalized.sort((left, right) => getDisplayName(left).localeCompare(getDisplayName(right), 'es', { sensitivity: 'base' }));
      nextSource = tableName;
      break;
    }

    if (nextRows.length === 0) {
      setAthletes([]);
      setSourceTable(null);
      setError(lastError ?? 'No se encontraron atletas en la base de datos.');
    } else {
      setAthletes(nextRows);
      setSourceTable(nextSource);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);

  const athletesCount = useMemo(() => athletes.length, [athletes.length]);

  if (roleLoading) {
    return <LoadingState message="Validando permisos..." />;
  }

  if (!canAccessAthletes(role)) {
    return (
      <ThemedView style={styles.screen}>
        <EmptyState
          title="Acceso denegado"
          message="No tienes permisos para acceder al panel de atletas."
        />
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#FFD700" />
          <ThemedText style={styles.loadingText}>Cargando atletas desde Supabase...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        data={athletes}
        keyExtractor={(item) => item._rowKey}
        renderItem={({ item }) => <AthleteCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAthletes} tintColor="#FFD700" />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <IconSymbol name="person.3.fill" size={30} color="#FFD700" />
              </View>
              <View style={styles.heroCopy}>
                <ThemedText style={styles.heroTitle}>Atletas</ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  Vista sincronizada con Supabase y preparada para mostrar cada registro completo.
                </ThemedText>
              </View>
              <Pressable style={styles.refreshButton} onPress={loadAthletes}>
                <ThemedText style={styles.refreshButtonText}>Actualizar</ThemedText>
              </Pressable>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryLabel}>Atletas</ThemedText>
                <ThemedText style={styles.summaryValue}>{athletesCount}</ThemedText>
              </View>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryLabel}>Fuente</ThemedText>
                <ThemedText style={styles.summaryValue}>{sourceTable ?? 'Sin fuente'}</ThemedText>
              </View>
            </View>

            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
            {!error && athletesCount === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>No hay atletas para mostrar</ThemedText>
                <ThemedText style={styles.emptyText}>
                  La consulta se ejecutÃ³ correctamente, pero la tabla no devolviÃ³ registros.
                </ThemedText>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          error ? null : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyTitle}>Sin resultados</ThemedText>
              <ThemedText style={styles.emptyText}>
                Si esperabas ver atletas aquÃ­, revisa los permisos RLS o confirma que la tabla de Supabase tenga datos.
              </ThemedText>
            </View>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  headerBlock: {
    gap: 14,
    marginBottom: 4,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: 'rgba(20, 20, 30, 0.96)',
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 58, 138, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  heroCopy: {
    gap: 6,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: fonts.sans,
    fontWeight: '800',
    color: '#F8F9FA',
  },
  heroSubtitle: {
    color: '#D6D6D6',
    lineHeight: 20,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFD700',
  },
  refreshButtonText: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
    backgroundColor: 'rgba(15, 15, 22, 0.95)',
    padding: 14,
    gap: 6,
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  errorText: {
    color: '#FCA5A5',
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  emptyState: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 15, 22, 0.9)',
    padding: 16,
    gap: 6,
  },
  emptyTitle: {
    color: '#F8F9FA',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyText: {
    color: '#C5CBD6',
    lineHeight: 20,
  },
  loadingCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#F8F9FA',
    fontWeight: '600',
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.24)',
    backgroundColor: 'rgba(18, 18, 26, 0.98)',
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 58, 138, 0.55)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: '#C5CBD6',
  },
  badge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaPill: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 2,
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    width: '48%',
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailValue: {
    color: '#F8F9FA',
    fontWeight: '600',
    lineHeight: 18,
  },
});
