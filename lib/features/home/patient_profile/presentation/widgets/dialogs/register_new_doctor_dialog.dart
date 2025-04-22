import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../../core/providers/patient_cubit.dart';
import '../../../../../../core/providers/user_cubit.dart';
import '../../../domain/entities/doctor.dart';

class RegisterNewDoctorDialog extends StatefulWidget {
  const RegisterNewDoctorDialog({super.key, this.onRegistered});
  final void Function(Doctor newDoctor)? onRegistered;

  @override
  State<RegisterNewDoctorDialog> createState() => _RegisterNewDoctorDialogState();
}

class _RegisterNewDoctorDialogState extends State<RegisterNewDoctorDialog> {
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _specialityController = TextEditingController();
  final TextEditingController _crmController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  @override
  void dispose() {
    for (final node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  Widget getTextField(String label, TextEditingController controller, int index) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
        focusNode: _focusNodes[index],
        decoration: InputDecoration(
          label: Text(label),
        ),
        textInputAction: TextInputAction.next,
        onTapOutside: (_) => FocusScope.of(context).unfocus(),
        onSubmitted: (_) {
          if (index + 1 < _focusNodes.length) {
            _focusNodes[index + 1].requestFocus();
          } else {
            FocusScope.of(context).unfocus();
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userData = context.read<UserCubit>();
    final patientData = context.read<PatientCubit>();

    return AlertDialog(
      title: Text(
        'Novo médico para ${userData.currentPatient?.self.fullName}',
        textAlign: TextAlign.center,
      ),
      content: SingleChildScrollView(
        child: Column(
          children: [
            getTextField('Nome', _nameController, 0),
            getTextField('Especialidade', _specialityController, 1),
            getTextField('CRM', _crmController, 2),
            getTextField('Telefone', _phoneController, 3),
            getTextField('Email', _emailController, 4),
            getTextField('Endereço', _addressController, 5),
          ],
        ),
      ),
      actionsAlignment: MainAxisAlignment.spaceBetween,
      actions: [
        OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
        FilledButton(
          onPressed: () async {
            final newDoctor = Doctor(
              id: 0,
              name: _nameController.text,
              speciality: _specialityController.text,
              crm: _crmController.text,
              phoneNumber: _phoneController.text,
              email: _emailController.text,
              address: _addressController.text,
            );

            await patientData.registerDoctor(userData.currentPatient!, newDoctor);
            if(widget.onRegistered != null){
              widget.onRegistered!(newDoctor);
            }
            context.pop();
          },
          child: const Text('Cadastrar'),
        ),
      ],
    );
  }
}
