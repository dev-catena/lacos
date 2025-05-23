import 'package:calendar_date_picker2/calendar_date_picker2.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SetTreatmentDurationDialog extends StatefulWidget {
  const SetTreatmentDurationDialog({
    required this.currentContinuousValue,
    required this.currentStart,
    required this.currentEnd,
    required this.onSet,
    super.key,
  });

  final bool? currentContinuousValue;
  final DateTime? currentStart;
  final DateTime? currentEnd;

  final void Function(DateTime startDate, DateTime? endDate, bool isContinuous) onSet;

  @override
  State<SetTreatmentDurationDialog> createState() => _SetTreatmentDurationDialogState();
}

class _SetTreatmentDurationDialogState extends State<SetTreatmentDurationDialog> {
  bool internContinuous = false;
  DateTime? internStart;
  DateTime? internEnd;

  @override
  void initState() {
    internContinuous = widget.currentContinuousValue ?? false;
    internStart = widget.currentStart;
    internEnd = widget.currentEnd;

    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Duração do tratamento', textAlign: TextAlign.center),
      contentPadding: EdgeInsets.zero,
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Tratamento continuo?'),
          Checkbox(
            value: internContinuous,
            onChanged: (value) {
              internContinuous = value!;
              if (!internContinuous) {
                internEnd = null;
              }
              setState(() {});
            },
          ),
          SizedBox(
            width: 500,
            child: CalendarDatePicker2(
              config: CalendarDatePicker2Config(
                calendarType: internContinuous ? null : CalendarDatePicker2Type.range,
              ),
              value: [internStart],
              onValueChanged: (value) {
                internEnd = null;
                internStart = value[0];
                if (value.length > 1) {
                  internEnd = value[1];
                }
              },
            ),
          ),
        ],
      ),
      actionsAlignment: MainAxisAlignment.spaceAround,
      actions: [
        OutlinedButton(
          onPressed: () {
            context.pop();
          },
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () {
            if(internStart == null) return;
            if (!internContinuous && internEnd == null) return;

            widget.onSet(internStart!, internEnd, internContinuous);
            context.pop();
          },
          child: const Text('Confirmar'),
        ),
      ],
    );
  }
}
