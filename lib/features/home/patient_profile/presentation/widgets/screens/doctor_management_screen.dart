import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../../core/providers/patient_cubit.dart';
import '../../../../../common/presentation/widgets/custom_scaffold.dart';

class DoctorManagementScreen extends StatelessWidget {
  const DoctorManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<PatientCubit>();
    return CustomScaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      onRefresh: () {},
      child: BlocBuilder<PatientCubit, PatientState>(
        builder: (_, state) {
          switch (state) {
            case PatientInitial():
              return const CircularProgressIndicator();
            case PatientReady():
              return _ReadyScreen(state);
          }
        },
      ),
    );
  }
}

class _ReadyScreen extends StatelessWidget {
  const _ReadyScreen(this.state);

  final PatientReady state;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ...List.generate(
          state.doctors.length,
          (index) {
            final doctor = state.doctors[index];

            return doctor.buildTile();
          },
        ),
      ],
    );
  }
}
