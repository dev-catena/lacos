import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/medication_schedule.dart';
import '../../../../common/presentation/widgets/components/schedule_component.dart';

class SelectFrequencyScheduleDialog extends StatefulWidget {
  const SelectFrequencyScheduleDialog({
    required this.currentType,
    required this.currentValue,
    required this.onConfirm,
    super.key,
  });

  final void Function(MedicationScheduleType type, dynamic value) onConfirm;
  final MedicationScheduleType? currentType;
  final dynamic currentValue;

  @override
  State<SelectFrequencyScheduleDialog> createState() => _SelectFrequencyScheduleDialogState();
}

class _SelectFrequencyScheduleDialogState extends State<SelectFrequencyScheduleDialog> {
  MedicationScheduleType? internType;
  dynamic internValue;

  @override
  void initState() {
    internType = widget.currentType;
    internValue = widget.currentValue;
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      contentPadding: EdgeInsets.all(20),
      title: const Text('Frequência de uso', textAlign: TextAlign.center),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScheduleComponent(
            currentType: internType ?? widget.currentType,
            currentValue: internValue ?? widget.currentValue,
            onTypeSet: (value) {
              if(internType != value) {
                internValue = null;
              }
              internType = value;
              setState(() {});
            },
            onValueSet: (value) {
              internValue = value;
              setState(() {});
            },
          ),
          const SizedBox(height: 20),
        ],
      ),
      insetPadding: EdgeInsets.all(30),
      actionsAlignment: MainAxisAlignment.spaceAround,
      actions: [
        OutlinedButton(onPressed: () => context.pop(), child: const Text('Cancelar')),
        FilledButton(
          onPressed: () {
            if(internType == null || internValue == null) return;

            widget.onConfirm(internType!, internValue!);
            context.pop();
          },
          child: const Text('Confirmar'),
        ),
      ],
    );
  }
}
