import { StyleSheet, View } from 'react-native';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { EmptyState, SectionHeader } from '@/shared/components';
import { canRegisterAttendance } from '@/shared/permissions/rolePermissions';
import { colors, spacing } from '@/shared/theme';
import { AttendanceRegisterView } from '../components/AttendanceRegisterView';
import { StudentAttendanceView } from '../components/StudentAttendanceView';

export default function AttendanceScreen() {
  const { role, userId } = useSessionRole();

  return (
    <View style={styles.container}>
      <SectionHeader title="Asistencias" subtitle="Registro y seguimiento" />
      {canRegisterAttendance(role || '') ? (
        <AttendanceRegisterView />
      ) : role === 'estudiante' || role === 'usuario' ? (
        <StudentAttendanceView userId={userId} />
      ) : (
        <EmptyState title="Sin acceso" message="No tienes permisos para este módulo." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.riovoley.dark,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
});
