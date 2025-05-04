import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';

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
  final codeController = TextEditingController();
  Doctor? doctor;
  File? selectedFile;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Cadastro de nova receita', textAlign: TextAlign.center),
      content: SingleChildScrollView(
        child: Column(
          children: [
            SelectDoctorComponent(onSelect: (doctorSelected) => doctor = doctorSelected),
            const SizedBox(height: 12),
            TextField(
              controller: codeController,
              onSubmitted: (_) => FocusScope.of(context).unfocus(),
              onTapOutside: (_) => FocusScope.of(context).unfocus(),
              onEditingComplete: () => FocusScope.of(context).unfocus(),
              decoration: const InputDecoration(
                label: Text('Código da receita'),
              ),
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
            if (doctor == null || codeController.text.isEmpty) {
              // Optionally show a warning
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Por favor, preencha todos os campos')),
              );
              return;
            }
            final pres = Prescription(
              id: 0,
              code: codeController.text,
              date: DateTime.now(),
              doctorName: doctor!.name,
              medications: [],
            );
            widget.onConfirm(pres);
          },
          child: const Text('Cadastrar'),
        ),
      ],
    );
  }
}
