import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'custom_selectable_tile.dart';
import 'stateful_segmented_button.dart';
import '../../../../medication/domain/entities/medication_schedule.dart';

class ScheduleComponent extends StatefulWidget {
  const ScheduleComponent({
    required this.onTypeSet,
    required this.onValueSet,
    required this.currentType,
    required this.currentValue,
    super.key,
  });

  final ValueChanged<MedicationScheduleType?> onTypeSet;
  final ValueChanged<dynamic> onValueSet;

  final MedicationScheduleType? currentType;
  final dynamic currentValue;

  @override
  State<ScheduleComponent> createState() => _ScheduleComponentState();
}

class _ScheduleComponentState extends State<ScheduleComponent> {
  MedicationScheduleType? selectedType;
  List<int> selectedWeekdays = [];
  int? intervalSelected;
  TimeOfDay? timeOfDaySelected;

  @override
  void initState() {
    selectedType = widget.currentType;
    switch (selectedType) {
      case null:
        break;
      case MedicationScheduleType.interval:
        intervalSelected = widget.currentValue;
      case MedicationScheduleType.daily:
        timeOfDaySelected = widget.currentValue;
      case MedicationScheduleType.weekly:
        selectedWeekdays = widget.currentValue;
      case MedicationScheduleType.cyclicWeekly:
      // TODO: Handle this case.
      case MedicationScheduleType.monthly:
      // TODO: Handle this case.
    }

    super.initState();
  }

  Widget _buildInputFields() {
    switch (selectedType) {
      case MedicationScheduleType.interval:
        final List<int> intervals = [2, 4, 6, 8, 10, 12];
        final int valueToUse;

        if (widget.currentValue is int) {
          valueToUse = widget.currentValue;
        } else {
          valueToUse = 2;
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Informe o intervalo entre\numa medicação e a próxima'),
            const SizedBox(width: 20),
            StatefulSegmentedButton<int>(
              options: intervals,
              getLabel: (value) => value.toString(),
              getValue: (value) => value,
              initialSelection: {intervalSelected ?? valueToUse},
              onChanged: (value) {
                intervalSelected = value.first;
                widget.onValueSet(value.first);
                setState(() {});
              },
            ),
          ],
        );
      case MedicationScheduleType.daily:
        return Column(
          children: [
            const Text('Informe o horário da medicação diária'),
            const SizedBox(width: 20),
            CustomSelectableTile(
              title: timeOfDaySelected != null
                  ? '${timeOfDaySelected!.hour.toString().padLeft(2, '0')}:${timeOfDaySelected!.minute.toString().padLeft(2, '0')}'
                  : 'Horário',
              onTap: () => showTimePicker(
                context: context,
                initialTime: timeOfDaySelected ?? TimeOfDay.now(),
              ).then(
                (value) {
                  if (value == null) return;
                  timeOfDaySelected = value;
                  widget.onValueSet(timeOfDaySelected);
                  setState(() {});
                },
              ),
              isActive: timeOfDaySelected != null,
            ),
          ],
        );
      case MedicationScheduleType.weekly:
        return Column(
          children: [
            const Text('Informe os dias da semana de medicação'),
            const SizedBox(width: 20),
            Wrap(
              spacing: 8,
              children: List.generate(7, (index) {
                final dayName = DateFormat.E('pt_BR').format(DateTime(2020, 1, index + 6));
                return FilterChip(
                  label: Text(dayName),
                  selected: selectedWeekdays.contains(index + 1),
                  showCheckmark: false,
                  onSelected: (selected) {
                    setState(() {
                      selected ? selectedWeekdays.add(index + 1) : selectedWeekdays.remove(index + 1);
                    });
                    widget.onValueSet(selectedWeekdays);
                  },
                );
              }),
            ),
          ],
        );
      case MedicationScheduleType.cyclicWeekly:
        final intervals = [1, 2, 3];

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Quantas semanas do mês haverá medicação?'),
            const SizedBox(width: 20),
            StatefulSegmentedButton<int>(
              options: intervals,
              multiSelect: false,
              getLabel: (value) => value.toString(),
              getValue: (value) => value,
              onChanged: (value) {},
            ),
          ],
        );
      case MedicationScheduleType.monthly:
        return const Text('');
      case null:
        return const Text('Selecione uma frequência de uso');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DropdownButton<MedicationScheduleType>(
          value: selectedType,
          items: MedicationScheduleType.values.map((type) {
            return DropdownMenuItem(value: type, child: Text(type.description));
          }).toList(),
          hint: const Text('Selecione'),
          onChanged: (value) {
            if (selectedType != value) {
              selectedWeekdays = [];
              intervalSelected = null;
              timeOfDaySelected = null;
            }

            selectedType = value!;
            widget.onTypeSet(selectedType);

            setState(() {});
          },
        ),
        _buildInputFields(),
      ],
    );
  }
}
