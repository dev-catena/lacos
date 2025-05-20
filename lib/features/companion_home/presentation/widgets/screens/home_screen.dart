import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/providers/user_cubit.dart';
import '../../../../../core/routes.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../components/emergency_button.dart';

import '../../../domain/entities/patient_event.dart';
import '../components/patient_last_activity_list.dart';
import '../dialogs/new_event_dialog.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final List<PatientEvent> lastActivities = [
      PatientEvent(
        id: 1,
        eventType: PatientEventType.appointment,
        title: 'Fisioterapia',
        description: 'Consulta com Dra. Sabrina Santos',
        dateTime: DateTime.now(),
      ),
      PatientEvent(
        id: 1,
        eventType: PatientEventType.warning,
        title: 'Ocorrência',
        description: 'Queda no quarto',
        dateTime: DateTime.now(),
      ),
      PatientEvent(
        id: 1,
        eventType: PatientEventType.appointment,
        title: 'Oftamologista',
        description: 'Consulta com Dr. Henrique',
        dateTime: DateTime(2025, 03, 08, 16, 45),
      ),
      PatientEvent(
        id: 1,
        eventType: PatientEventType.call,
        title: 'Chamada',
        description: 'Chamada recebida de Beth Guimarães',
        dateTime: DateTime(2025, 03, 08, 10, 11),
      ),
      PatientEvent(
        id: 1,
        eventType: PatientEventType.medicalTest,
        description: 'Emissão de resultado de teste de urina',
        dateTime: DateTime(2025, 03, 08, 08, 23),
      ),
      PatientEvent(
        id: 1,
        eventType: PatientEventType.appointment,
        title: 'Oftamologista',
        description: 'Consulta com Dr. Henrique',
        dateTime: DateTime(2025, 03, 07, 14, 12),
      ),
      PatientEvent(
        id: 1,
        eventType: PatientEventType.call,
        title: 'Chamada',
        description: 'Chamada recebida de Ântonio Beltrão',
        dateTime: DateTime(2025, 03, 07, 12, 56),
      ),
      PatientEvent(
        id: 1,
        eventType: PatientEventType.dataGathered,
        title: 'Informações coletadas',
        description: 'Pressão, temperatura e glicose',
        dateTime: DateTime(2025, 03, 07, 09, 35),
      ),
    ];

    return CustomScaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showDialog(context: context, builder: (context) => const NewEventDialog());
        },
        child: const Icon(Icons.add),
      ),
      child: BlocBuilder<UserCubit, UserState>(
        builder: (_, __) {
          final patient = context.read<UserCubit>().currentPatient;

          if (patient == null) {
            context.go(AppRoutes.groupSelectionScreen);
            return const Center(child: Text('Paciente não selecionado'));
          } else {
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SearchBar(
                  leading: Icon(Icons.search),
                  hintText: 'Pesquise aqui',
                  trailing: [
                    Icon(Icons.clear),
                  ],
                ),
                const SizedBox(height: 14),
                patient.buildResumeCard(
                  [
                    PatientEvent(
                      id: 1,
                      eventType: PatientEventType.goodMood,
                      description: 'Muito bom humor',
                      dateTime: DateTime.now(),
                    ),
                    PatientEvent(
                      id: 1,
                      eventType: PatientEventType.location,
                      description: 'Em casa',
                    ),
                  ],
                ),
                const EmergencyButton(),
                PatientLastActivityList(lastActivities),
              ],
            );
          }
        },
      ),
    );
  }
}
