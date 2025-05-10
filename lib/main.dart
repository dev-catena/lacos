import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'core/app_theme.dart';
import 'core/providers/app_data_cubit.dart';
import 'core/providers/patient_cubit.dart';
import 'core/routes.dart';
import 'core/utils/globals.dart';
import 'core/providers/user_cubit.dart';
import 'features/common/data/data_source/medication_data_source.dart';
import 'features/common/data/data_source/medicine_datasource.dart';
import 'features/common/data/data_source/user_datasource.dart';
import 'features/companion_home/patient_profile/data/data_source/doctor_datasource.dart';
import 'firebase_options.dart';

// mkdir archive\data\data_source
// mkdir archive\data\models
// mkdir archive\data\repositories
// mkdir archive\domain\entities
// mkdir archive\domain\repositories
// mkdir archive\domain\usecases
// mkdir archive\presentation\blocs
// mkdir archive\presentation\widgets
// mkdir archive\presentation\widgets\screens
// mkdir archive\presentation\widgets\components

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt_BR', null);
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const LacosApp());
}

class LacosApp extends StatelessWidget {
  const LacosApp({super.key});

  static final GoRouter _routes = AppRoutes().routes;

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        RepositoryProvider(create: (_) => UserCubit(UserDataSource())),
        RepositoryProvider(create: (_) => PatientCubit(DoctorDataSource(), MedicationDataSource())),
        RepositoryProvider(create: (_) => AppDataCubit(MedicineDataSource())),
      ],
      child: MaterialApp.router(
        scaffoldMessengerKey: Globals.scaffoldMessengerKey,
        title: 'Laços',
        theme: AppTheme().getAppTheme(context),
        routeInformationParser: _routes.routeInformationParser,
        routeInformationProvider: _routes.routeInformationProvider,
        routerDelegate: _routes.routerDelegate,
      ),
    );
  }
}
