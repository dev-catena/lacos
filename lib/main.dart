import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'core/app_theme.dart';
import 'core/providers/patient_cubit.dart';
import 'core/routes.dart';
import 'core/utils/globals.dart';
import 'core/providers/user_cubit.dart';
import 'features/common/data/data_source/user_datasource.dart';
import 'features/home/patient_profile/data/data_source/doctor_datasource.dart';

// mkdir user_profile\data\data_source
// mkdir user_profile\data\models
// mkdir user_profile\data\repositories
// mkdir user_profile\domain\entities
// mkdir user_profile\domain\repositories
// mkdir user_profile\domain\usecases
// mkdir user_profile\presentation\blocs
// mkdir user_profile\presentation\widgets
// mkdir user_profile\presentation\widgets\screens
// mkdir user_profile\presentation\widgets\components

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt_BR', null);
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
        RepositoryProvider(create: (_) => PatientCubit(DoctorDataSource())),
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
