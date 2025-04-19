import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../features/appointment_schedule/presentation/widgets/screens/appointment_schedule_screen.dart';
import '../features/chat/presentation/widgets/screens/chat_screen.dart';
import '../features/common/data/data_source/user_datasource.dart';
import '../features/home/patient_profile/presentation/widgets/screens/doctor_management_screen.dart';
import '../features/home/patient_profile/data/data_source/doctor_datasource.dart';
import '../features/home/patient_profile/presentation/widgets/screens/patient_collectable_data_screen.dart';
import '../features/medicines/data/medication_datasource.dart';
import '../features/user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../features/home/patient_profile/presentation/widgets/screens/group_management_screen.dart';
import '../features/home/patient_profile/presentation/widgets/screens/patient_profile_screen.dart';
import '../features/login/presentation/widgets/login_screen.dart';
import '../features/medicines/presentation/blocs/medication_bloc.dart';
import '../features/user_profile/presentation/widgets/screens/user_profile_screen.dart';
import '../splash_screen.dart';

import '../features/home/presentation/widgets/screens/home_screen.dart';
import 'scaffold_with_nested_navigation.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorAKey = GlobalKey<NavigatorState>(debugLabel: 'shellA');
final _shellNavigatorBKey = GlobalKey<NavigatorState>(debugLabel: 'shellB');
final _shellNavigatorCKey = GlobalKey<NavigatorState>(debugLabel: 'shellC');
final _shellNavigatorDKey = GlobalKey<NavigatorState>(debugLabel: 'shellD');
final _shellNavigatorEKey = GlobalKey<NavigatorState>(debugLabel: 'shellE');

class AppRoutes {
  static const loginScreen = '/login';
  static const splashScreen = '/splash';
  static const groupSelectionScreen = '/selecionar-grupo';

  static const homeScreen = '/';
  static const medicinesScreen = '/medicamentos';
  static const appointmentScheduleScreen = '/agenda';
  static const chatScreen = '/chat';

  // dentro de [homeScreen]
  static const patientProfileScreen = 'perfil-paciente';
  static const patientCollectableDataScreen = 'dados-coletaveis';
  static const groupManagementScreen = 'gerenciar-grupo';
  static const doctorManagementScreen = 'gerenciar-medicos';

  static const userProfileScreen = '/perfil-usuario';

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
          navigatorKey: _shellNavigatorAKey,
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
                      path: AppRoutes.groupManagementScreen,
                      name: AppRoutes.groupManagementScreen,
                      builder: (_, state) {
                        final patient = state.extra as Patient;

                        return GroupManagementScreen(patient);
                      },
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
              pageBuilder: (context, state) {
                return NoTransitionPage(
                  child: BlocProvider(
                    create: (context) => MedicationBloc(MedicationDataSource()),
                    child: const MedicinesScreen(),
                  ),
                );
              },
              routes: const [],
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
        // StatefulShellBranch(
        //   navigatorKey: _shellNavigatorEKey,
        //   routes: [],
        // ),
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
        ),
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
