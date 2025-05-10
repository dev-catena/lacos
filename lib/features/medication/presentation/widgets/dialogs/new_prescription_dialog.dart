import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';

import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../../common/presentation/widgets/components/file_preview.dart';
import '../../../../companion_home/patient_profile/domain/entities/doctor.dart';
import '../../../domain/entities/prescription.dart';
import '../components/select_doctor_component.dart';

class NewPrescriptionDialog extends StatefulWidget {
  const NewPrescriptionDialog({super.key, required this.onConfirm});

  final void Function(Prescription newPrescription) onConfirm;

  @override
  State<NewPrescriptionDialog> createState() => _NewPrescriptionDialogState();
}

class _NewPrescriptionDialogState extends State<NewPrescriptionDialog> {
  Doctor? doctor;
  File? selectedFile;
  DateTime? dateSelected = DateTime.now();

  void setDate(DateTime? date) {
    dateSelected = date;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Cadastro de nova receita', textAlign: TextAlign.center),
      content: SingleChildScrollView(
        child: Column(
          children: [
            SelectDoctorComponent(onSelect: (doctorSelected) => doctor = doctorSelected),
            const SizedBox(height: 12),
            const Text('Data de emissão'),
            CustomSelectableTile(
              title: dateSelected != null ? DateFormat('dd/MM/y').format(dateSelected!) : 'Data',
              onTap: () => showDialog(
                context: context,
                builder: (_) => DatePickerDialog(
                  firstDate: DateTime.now().subtract(const Duration(days: 180)),
                  lastDate: DateTime.now(),
                  initialDate: dateSelected,
                  currentDate: dateSelected,
                ),
              ).then((value) => setDate(value)),
              isActive: dateSelected != null,
            ),
            const SizedBox(height: 12),
            if (selectedFile != null)
              ConstrainedBox(
                constraints: const BoxConstraints(
                  maxHeight: 200,
                ),
                child: FilePreview(
                  key: ValueKey(selectedFile!.path),
                  file: selectedFile!,
                ),
              ),
            IconButton(
              onPressed: () {
                FilePicker.platform.pickFiles().then(
                  (value) {
                    if (value != null) {
                      setState(() {
                        selectedFile = File(value.files.single.path!);
                      });
                    }
                  },
                );
              },
              icon: const Icon(Icons.attachment),
            ),
          ],
        ),
      ),
      actionsAlignment: MainAxisAlignment.spaceBetween,
      actions: [
        OutlinedButton(
          onPressed: () => context.pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () {
            if (doctor == null || dateSelected == null) {
              // Optionally show a warning
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Preencha todos os campos')),
              );
              return;
            }
            final pres = Prescription(
              id: 0,
              createdAt: dateSelected!,
              doctorName: doctor!.name,
              speciality: doctor!.speciality,
              medications: [],
              isActive: true,
              lastUpdate: DateTime.now(),
            );

            widget.onConfirm(pres);
          },
          child: const Text('Cadastrar'),
        ),
      ],
    );
  }
}
