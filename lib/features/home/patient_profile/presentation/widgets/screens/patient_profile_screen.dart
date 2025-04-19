import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../../core/providers/user_cubit.dart';
import '../../../../../../core/routes.dart';
import '../../../../../common/presentation/widgets/custom_scaffold.dart';

class PatientProfileScreen extends StatelessWidget {
  const PatientProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final patient = context.read<UserCubit>().currentPatient;

    return CustomScaffold(
      child: Column(
        children: [
          ...List.generate(
            PatientProfileOption.values.length,
            (index) {
              final option = PatientProfileOption.values[index];

              return option.buildTile(context, option == PatientProfileOption.manageGroup ? patient : null);
            },
          ),
        ],
      ),
    );
  }
}

enum PatientProfileOption {
  information('Informações do paciente', 'route', Icons.account_circle_outlined),
  location('Localização', 'route', Icons.location_on_outlined),
  media('Mídias', 'route', Icons.photo),
  manageGroup('Gerenciar grupo', AppRoutes.groupManagementScreen, Icons.diversity_1_outlined),
  manageDoctors('Médicos cadastrados', AppRoutes.doctorManagementScreen, Icons.badge_outlined),
  config('Configurações', AppRoutes.patientCollectableDataScreen, Icons.settings);

  final String description;
  final String route;
  final IconData icon;

  const PatientProfileOption(this.description, this.route, this.icon);

  Widget buildTile(BuildContext context, [Object? extra]) {
    return ListTile(
      title: Text(description),
      leading: Icon(icon),
      onTap: () {
        context.pushNamed(route, extra: extra);
      },
    );
  }
}
