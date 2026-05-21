import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { AthletesFilters } from '../types/athletes.types';

interface AthletesFiltersProps {
  filters: AthletesFilters;
  categories: string[];
  onChange: (next: AthletesFilters) => void;
}

const SORT_OPTIONS: Array<{ value: AthletesFilters['sortBy']; label: string }> = [
  { value: 'apellido', label: 'Apellido' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'categoria', label: 'Categoria' },
  { value: 'edad', label: 'Edad' },
  { value: 'ingreso', label: 'Ingreso' },
];

export function AthletesFiltersBar({ filters, categories, onChange }: AthletesFiltersProps) {
  const [openFilter, setOpenFilter] = useState<'status' | 'category' | 'sort' | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const toggle = (key: 'status' | 'category' | 'sort') => {
    setOpenFilter((prev) => (prev === key ? null : key));
  };

  const currentCategoryLabel = filters.categoria ? filters.categoria.replaceAll('_', ' ') : 'Todas';
  const sortLabel = SORT_OPTIONS.find((option) => option.value === filters.sortBy)?.label || 'Apellido';
  const currentSortLabel = `${sortLabel} ${filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}`;

  return (
    <View style={styles.container}>
      <TextInput
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="Buscar por nombre, email o categoria"
        placeholderTextColor={colors.riovoley.mutedText}
        style={styles.input}
      />

      <View style={styles.searchActions}>
        <Pressable style={styles.searchBtn} onPress={() => onChange({ ...filters, search: searchInput.trim() })}>
          <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
        </Pressable>
        <Pressable
          style={styles.clearBtn}
          onPress={() => {
            setSearchInput('');
            onChange({ ...filters, search: '' });
          }}>
          <ThemedText style={styles.clearBtnText}>Limpiar</ThemedText>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={styles.filterBtn} onPress={() => toggle('status')}>
          <ThemedText style={styles.filterBtnText}>
            Estado: {filters.status === 'all' ? 'Todos' : filters.status === 'active' ? 'Activos' : 'Suspendidos'}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.filterBtn} onPress={() => toggle('category')}>
          <ThemedText style={styles.filterBtnText}>Categoria: {currentCategoryLabel}</ThemedText>
        </Pressable>
        <Pressable style={styles.filterBtn} onPress={() => toggle('sort')}>
          <ThemedText style={styles.filterBtnText}>Orden: {currentSortLabel}</ThemedText>
        </Pressable>
      </View>

      {openFilter === 'status' ? (
        <View style={styles.menu}>
          {['all', 'active', 'suspended'].map((status) => (
            <Pressable
              key={status}
              style={[styles.chip, filters.status === status && styles.chipActive]}
              onPress={() => onChange({ ...filters, status: status as AthletesFilters['status'] })}>
              <ThemedText style={styles.chipText}>{status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Suspendidos'}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {openFilter === 'category' ? (
        <View style={styles.menu}>
          <Pressable
            style={[styles.chip, !filters.categoria && styles.chipActive]}
            onPress={() => onChange({ ...filters, categoria: '' })}>
            <ThemedText style={styles.chipText}>Todas las categorias</ThemedText>
          </Pressable>
          {categories.map((categoria) => (
            <Pressable
              key={categoria}
              style={[styles.chip, filters.categoria === categoria && styles.chipActive]}
              onPress={() => onChange({ ...filters, categoria })}>
              <ThemedText style={styles.chipText}>{categoria.replaceAll('_', ' ')}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {openFilter === 'sort' ? (
        <View style={styles.menu}>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, filters.sortBy === option.value && styles.chipActive]}
              onPress={() => onChange({ ...filters, sortBy: option.value })}>
              <ThemedText style={styles.chipText}>{option.label}</ThemedText>
            </Pressable>
          ))}
          <Pressable
            style={[styles.chip, styles.orderChip]}
            onPress={() => onChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}>
            <ThemedText style={styles.chipText}>{filters.sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[2], marginBottom: spacing[3] },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    color: colors.riovoley.text,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  searchActions: { flexDirection: 'row', gap: spacing[2] },
  searchBtn: {
    flex: 1,
    backgroundColor: colors.riovoley.gold,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  searchBtnText: { color: colors.riovoley.dark, fontWeight: '800' },
  clearBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  clearBtnText: { fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  filterBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  filterBtnText: { fontSize: 12, fontWeight: '700' },
  menu: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  chipActive: { backgroundColor: 'rgba(245,179,58,0.22)' },
  chipText: { fontSize: 12, fontWeight: '700' },
  orderChip: { minWidth: 120, alignItems: 'center' },
});
