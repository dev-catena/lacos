import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/appointment_schedule/presentation/widgets/screens/appointment_schedule_screen.dart';
import '../features/archive/presentation/widgets/screens/archive_screen.dart';
import '../features/archive/presentation/widgets/screens/prescription_archive_screen.dart';
import '../features/chat/presentation/widgets/screens/chat_screen.dart';
import '../features/common/domain/entities/patient.dart';
import '../features/companion_home/patient_profile/presentation/widgets/screens/doctor_management_screen.dart';
import '../features/companion_home/patient_profile/presentation/widgets/screens/group_management_screen.dart';
import '../features/companion_home/patient_profile/presentation/widgets/screens/patient_collectable_data_screen.dart';
import '../features/companion_home/patient_profile/presentation/widgets/screens/patient_profile_screen.dart';
import '../features/companion_home/presentation/widgets/screens/home_screen.dart';
import '../features/medication/domain/entities/prescription.dart';
import '../features/medication/presentation/widgets/screens/medications_screen.dart';
import '../features/medication/presentation/widgets/screens/new_medication_screen.dart';
import '../features/medication/presentation/widgets/screens/prescription_medications_screen.dart';
import '../features/medication/presentation/widgets/screens/prescription_panel_screen.dart';
import '../features/patient_home/presentation/widgets/screens/patient_home_screen.dart';
import '../features/user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../features/login/presentation/widgets/login_screen.dart';
import '../features/user_profile/presentation/widgets/screens/user_profile_screen.dart';
import '../splash_screen.dart';

import 'scaffold_with_nested_navigation.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellCompanionNavigatorAKey = GlobalKey<NavigatorState>(debugLabel: 'shellA');
final _shellNavigatorBKey = GlobalKey<NavigatorState>(debugLabel: 'shellB');
final _shellNavigatorCKey = GlobalKey<NavigatorState>(debugLabel: 'shellC');
final _shellNavigatorDKey = GlobalKey<NavigatorState>(debugLabel: 'shellD');
final _shellNavigatorEKey = GlobalKey<NavigatorState>(debugLabel: 'shellE');

final _shellPatientNavigatorAKey = GlobalKey<NavigatorState>(debugLabel: 'shellPatientA');

class AppRoutes {
  static const loginScreen = '/login';
  static const splashScreen = '/splash';
  static const groupSelectionScreen = '/selecionar-grupo';

  static const homeScreen = '/';
  static const medicinesScreen = '/medicamentos';
  static const appointmentScheduleScreen = '/agenda';
  static const chatScreen = '/chat';
  static const archiveScreen = '/arquivo';

  // dentro de [homeScreen]
  static const patientProfileScreen = 'perfil-paciente';
  static const patientCollectableDataScreen = 'dados-coletaveis';
  static const groupManagementScreen = 'gerenciar-grupo';
  static const doctorManagementScreen = 'gerenciar-medicos';

  // dentro de [medicinesScreen]
  static const newMedicineScreen = 'novo-medicamento';
  static const prescriptionPanelScreen = 'receitas';
  static const prescriptionMedicationsScreen = 'medicamentos-receita';

  static const userProfileScreen = '/perfil-usuario';

  static const patientHomeScreen = '/paciente';

  static const prescriptionArchive = 'arquivo-receita';

  GoRouter get routes {
    return _routes;
  }
}

final GoRouter _routes = GoRouter(
  initialLocation: AppRoutes.loginScreen,
  navigatorKey: _rootNavigatorKey,
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ScaffoldWithNestedNavigation(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          navigatorKey: _shellCompanionNavigatorAKey,
          initialLocation: AppRoutes.homeScreen,
          routes: [
            GoRoute(
              path: AppRoutes.homeScreen,
              name: 'home',
              pageBuilder: (_, __) => const NoTransitionPage(child: HomeScreen()),
              routes: [
                GoRoute(
                  path: AppRoutes.patientProfileScreen,
                  name: AppRoutes.patientProfileScreen,
                  builder: (_, __) => const PatientProfileScreen(),
                  routes: [
                    GoRoute(
                      path: AppRoutes.patientCollectableDataScreen,
                      name: AppRoutes.patientCollectableDataScreen,
                      builder: (_, __) => const PatientCollectableDataScreen(),
                    ),
                    GoRoute(
                      path: AppRoutes.doctorManagementScreen,
                      name: AppRoutes.doctorManagementScreen,
                      builder: (_, __) {
                        return const DoctorManagementScreen();
                      },
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorBKey,
          initialLocation: AppRoutes.medicinesScreen,
          routes: [
            GoRoute(
              path: AppRoutes.medicinesScreen,
              name: AppRoutes.medicinesScreen,
              pageBuilder: (context, state) => const NoTransitionPage(
                child: MedicationsScreen(),
              ),
              routes: [
                GoRoute(
                  name: AppRoutes.prescriptionPanelScreen,
                  path: AppRoutes.prescriptionPanelScreen,
                  builder: (context, state) => const PrescriptionPanelScreen(),
                  routes: [
                    GoRoute(
                      name: AppRoutes.prescriptionMedicationsScreen,
                      path: AppRoutes.prescriptionMedicationsScreen,
                      builder: (_, state) {
                        final pres = state.extra as Prescription;

                        return PrescriptionMedicationsScreen(pres);
                      },
                      routes: [
                        GoRoute(
                          name: AppRoutes.newMedicineScreen,
                          path: AppRoutes.newMedicineScreen,
                          builder: (_, state) {
                            final pres = state.extra as Prescription;
                            return NewMedicationScreen(pres);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            )
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorCKey,
          initialLocation: AppRoutes.appointmentScheduleScreen,
          routes: [
            GoRoute(
              path: AppRoutes.appointmentScheduleScreen,
              name: AppRoutes.appointmentScheduleScreen,
              pageBuilder: (context, state) => const NoTransitionPage(child: AppointmentScheduleScreen()),
              routes: const [],
            ),
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorDKey,
          initialLocation: AppRoutes.chatScreen,
          routes: [
            GoRoute(
              path: AppRoutes.chatScreen,
              name: AppRoutes.chatScreen,
              pageBuilder: (context, state) => const NoTransitionPage(child: ChatScreen()),
              routes: const [],
            ),
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorEKey,
          initialLocation: AppRoutes.archiveScreen,
          routes: [
            GoRoute(
              path: AppRoutes.archiveScreen,
              name: AppRoutes.archiveScreen,
              pageBuilder: (context, state) => const NoTransitionPage(child: ArchiveScreen()),
              routes: [
                GoRoute(
                  path: AppRoutes.prescriptionArchive,
                  name: AppRoutes.prescriptionArchive,
                  builder: (context, state) => const PrescriptionArchiveScreen(),
                )
              ],
            ),
          ],
        ),
      ],
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ScaffoldWithNestedNavigation(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          navigatorKey: _shellPatientNavigatorAKey,
          routes: [
            GoRoute(
              path: AppRoutes.patientHomeScreen,
              name: 'patient-home',
              pageBuilder: (_, __) => const NoTransitionPage(child: PatientHomeScreen()),
              routes: [],
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      path: AppRoutes.userProfileScreen,
      name: AppRoutes.userProfileScreen,
      builder: (_, __) => const UserProfileScreen(),
      routes: [
        GoRoute(
            path: AppRoutes.groupSelectionScreen,
            name: AppRoutes.groupSelectionScreen,
            builder: (_, __) => const GroupSelectionScreen(),
            routes: [
              GoRoute(
                path: AppRoutes.groupManagementScreen,
                name: AppRoutes.groupManagementScreen,
                builder: (_, state) {
                  final patient = state.extra as Patient;

                  return GroupManagementScreen(patient);
                },
              ),
            ]),
      ],
    ),
    GoRoute(
      path: AppRoutes.splashScreen,
      name: AppRoutes.splashScreen,
      builder: (_, __) => const SplashScreen(),
    ),
    GoRoute(
      path: AppRoutes.loginScreen,
      name: AppRoutes.loginScreen,
      builder: (_, __) => LoginScreen(),
    ),
  ],
);
