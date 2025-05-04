import 'package:flutter/material.dart';

import '../../../../../common/domain/entities/patient.dart';
import '../../../../../../core/utils/custom_colors.dart';
import '../../../../../common/data/data_source/user_datasource.dart';
import '../../../../../common/presentation/widgets/custom_scaffold.dart';

class GroupManagementScreen extends StatelessWidget {
  const GroupManagementScreen(this.patient, {super.key});

  final Patient patient;

  @override
  Widget build(BuildContext context) {
    final titleLarge = Theme.of(context).textTheme.titleSmall!;

    return CustomScaffold(
      child: Column(
        children: [
          patient.buildResumeCard([]),
          const SizedBox(height: 15),
          getScreen(titleLarge),
        ],
      ),
    );
  }

  Widget getScreen(TextStyle titleLarge) {
    final acceptedScreen = Column(
      children: [
        Text('Código do grupo', style: titleLarge),
        Text(patient.groupCode),
        Text('Membros do grupo', style: titleLarge),
        patient.usersForPatient.isEmpty ? const Text('Nenhum acompanhante atribuido') : const SizedBox(),
        ...List.generate(
          patient.usersForPatient.length,
          (index) {
            final user = patient.usersForPatient[index];

            return ListTile(
              title: Text(user.fullName),
              leading: CircleAvatar(backgroundImage: NetworkImage(user.photoPath)),
              trailing: const Icon(Icons.delete_outline, color: CustomColor.vividRed),
            );
          },
        ),
        IconButton(
          onPressed: () {},
          icon: const Icon(Icons.add_circle_outline, size: 35),
        ),
      ],
    );

    final pendingScreen = Column(
      children: [
        Text('Insira o código do grupo', style: titleLarge),
        const TextField(
          decoration: InputDecoration(
            label: Text('Código'),
            hintText: 'XXX XXX',
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );

    switch (patient.status) {
      case GroupStatus.pending:
        return pendingScreen;
      case GroupStatus.accepted:
        return acceptedScreen;
    }
  }
}
