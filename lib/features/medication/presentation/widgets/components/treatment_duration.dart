import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';

class TreatmentDuration extends StatefulWidget {
  const TreatmentDuration({required this.onDatePicked, required this.onCheck, super.key});

  final ValueChanged<DateTime?> onDatePicked;
  final ValueChanged<bool> onCheck;

  @override
  State<TreatmentDuration> createState() => _TreatmentDurationState();
}

class _TreatmentDurationState extends State<TreatmentDuration> {
  DateTime? startDate;
  final durationController = TextEditingController();
  bool isContinuous = false;

  @override
  Widget build(BuildContext context) {
    final treatmentDuration = startDate != null
        ? DateFormat('dd/MM/yyyy', 'pt_BR')
            .format(startDate!.add(Duration(days: int.tryParse(durationController.text) ?? 0)))
        : '';

    return Column(
      children: [
        const Text('Tratamento contínuo?'),
        Checkbox(
          value: isContinuous,
          onChanged: (value) {
            widget.onCheck(value!);
            isContinuous = value;
            if (!isContinuous) durationController.clear();
            setState(() {});
          },
        ),
        const SizedBox(height: 10),
        const Text('Início do tratamento'),
        const SizedBox(height: 10),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CustomSelectableTile(
              height: 56,
              title: startDate != null ? DateFormat('dd/MM/yyyy', 'pt_BR').format(startDate!) : 'Início',
              onTap: () {
                showDatePicker(
                  context: context,
                  firstDate: DateTime.now(),
                  initialDate: startDate,
                  lastDate: DateTime.now().add(const Duration(days: 3650)),
                ).then(
                  (value) {
                    widget.onDatePicked(value);
                    startDate = value;
                    setState(() {});
                  },
                );
              },
              isActive: startDate != null,
            ),
            if (!isContinuous) const SizedBox(width: 10),
            if (!isContinuous)
              Expanded(
                child: TextField(
                  controller: durationController,
                  decoration: const InputDecoration(
                    label: Text('Duração (dias)'),
                    border: OutlineInputBorder(),
                  ),
                  onTapOutside: (event) {
                    FocusScope.of(context).unfocus();
                    setState(() {});
                  },
                  onSubmitted: (value) {
                    FocusScope.of(context).unfocus();
                    setState(() {});
                  },
                  onEditingComplete: () {
                    FocusScope.of(context).unfocus();
                    setState(() {});
                  },
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                  ],
                  keyboardType: TextInputType.number,
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        if (!isContinuous && startDate != null && durationController.text != '')
          Text('Fim do tratamento:\n$treatmentDuration', textAlign: TextAlign.center),
      ],
    );
  }
}
