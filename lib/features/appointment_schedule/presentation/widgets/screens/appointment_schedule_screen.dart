import 'package:flutter/material.dart';

import '../../../../../core/utils/date_parser.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../../home/domain/entities/patient_event.dart';

class AppointmentScheduleScreen extends StatelessWidget {
  const AppointmentScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;
    final parser = DateParser<PatientEvent>(data: _MockData.appointments, getDate: (event) => event.dateTime!);
    final grouped = parser.groupByDate();

    return CustomScaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Agenda de consultas', style: titleMedium, textAlign: TextAlign.start),
          ...List.generate(grouped.length, (index) {
            final group = grouped[index];

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(group.date, textAlign: TextAlign.start),
                ...group.values.map((event) {
                  return event.buildTile();
                }),
                const SizedBox(height: 28),
              ],
            );
          }),
        ],
      ),
    );
  }
}

class _MockData {
  static final appointments = [
    PatientEvent(
      eventType: PatientEvents.appointment,
      description: 'Dr. Cleber Leite',
      title: 'Cardiologista',
      dateTime: DateTime.now().add(const Duration(days: 1)),
    ),
    PatientEvent(
      eventType: PatientEvents.appointment,
      description: 'Dra. Maria Rosa',
      title: 'Dentista',
      dateTime: DateTime.now(),
    ),
    PatientEvent(
      eventType: PatientEvents.appointment,
      description: 'Dra. Carla Moraes',
      title: 'Demartologista',
      dateTime: DateTime(2025, 2, 14, 08, 20),
    ),
    PatientEvent(
      eventType: PatientEvents.appointment,
      description: 'Dr. Pedro Lima',
      title: 'Ortopedista',
      dateTime: DateTime(2025, 1, 22, 10, 00),
    ),
  ];
}
