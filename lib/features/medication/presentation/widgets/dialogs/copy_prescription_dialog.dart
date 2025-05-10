import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../../core/utils/custom_colors.dart';
import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../domain/entities/prescription.dart';

class CopyPrescriptionDialog extends StatefulWidget {
  const CopyPrescriptionDialog(this.prescription, {required this.onCreated, super.key});

  final Prescription prescription;
  final void Function(Prescription newPres) onCreated;

  @override
  State<CopyPrescriptionDialog> createState() => _CopyPrescriptionDialogState();
}

class _CopyPrescriptionDialogState extends State<CopyPrescriptionDialog> {
  late final medList = List.of(widget.prescription.medications);
  DateTime? dateSelected = DateTime.now();

  void setDate(DateTime? date) {
    dateSelected = date;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Criar cópia de receita'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Prescrito por ${widget.prescription.doctorName}'),
            const SizedBox(height: 8),
            const Text('Data de emissão'),
            CustomSelectableTile(
              title: dateSelected != null ? DateFormat('dd/MM/y').format(dateSelected!) : 'Data',
              onTap: () => showDialog(
                context: context,
                builder: (_) => DatePickerDialog(
                  firstDate: DateTime.now().subtract(Duration(days: 180)),
                  lastDate: DateTime.now(),
                  initialDate: dateSelected,
                  currentDate: dateSelected,
                ),
              ).then((value) => setDate(value)),
              isActive: dateSelected != null,
            ),
            const SizedBox(height: 8),
            const Text('Medicações'),
            ...List.generate(
              medList.length,
              (index) {
                final med = medList[index];

                return med.buildTile(
                  onTap: () {},
                  trailing: IconButton(
                    onPressed: () {
                      medList.remove(med);
                      setState(() {});
                    },
                    icon: const Icon(Icons.remove_circle_outline, color: CustomColor.vividRed),
                  ),
                );
              },
            )
          ],
        ),
      ),
      actionsAlignment: MainAxisAlignment.spaceBetween,
      actions: [
        OutlinedButton(onPressed: () =>context.pop(), child: const Text('Cancelar')),
        FilledButton(
          onPressed: () {
            final pres = widget.prescription.copyWith(medications: medList, createdAt: dateSelected!);
            widget.onCreated(pres);
            context.pop();
          },
          child: const Text('Copiar'),
        ),
      ],
    );
  }
}
