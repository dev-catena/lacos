import 'package:flutter/material.dart';

import '../../../domain/entities/patient_event.dart';

class NewEventDialog extends StatefulWidget {
  const NewEventDialog({super.key});

  @override
  State<NewEventDialog> createState() => _NewEventDialogState();
}

class _NewEventDialogState extends State<NewEventDialog> {
  PatientEventType? typeSelected;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Registrar novo evento'),
      content: SingleChildScrollView(
        child: Column(
          children: [
            Wrap(
              spacing: 10,
              children: List.generate(
                PatientEventType.values.length,
                    (index) {
                  final event = PatientEventType.values[index];

                  return event.buildSelector(
                    typeSelected == event,
                        (value) {
                      typeSelected = value;

                      setState(() {});
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
