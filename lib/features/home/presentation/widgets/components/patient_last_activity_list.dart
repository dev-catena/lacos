import 'package:flutter/material.dart';

import '../../../../../core/utils/date_parser.dart';
import '../../../domain/entities/patient_event.dart';

class PatientEventGroup {
  final String date;
  final List<PatientEvent> events;

  PatientEventGroup({
    required this.date,
    required this.events,
  });
}

class PatientLastActivityList extends StatelessWidget {
  const PatientLastActivityList(this.events, {super.key});

  final List<PatientEvent> events;

  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;
    final parser = DateParser<PatientEvent>(data: events, getDate: (event) => event.dateTime!);
    final groupedEvents = parser.groupByDate();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Atividades recentes', style: titleMedium, textAlign: TextAlign.start),
        ...List.generate(groupedEvents.length, (index) {
          final group = groupedEvents[index];

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
    );
  }
}
