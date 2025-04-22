import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../blocs/medication_bloc.dart';
import '../../../domain/entities/medicine.dart';

class TodayUseMedications extends StatelessWidget {
  const TodayUseMedications(this.medicines, {super.key});
  final List<Medication> medicines;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<MedicationBloc>();

    // Organize os medicamentos por períodos do dia
    final morningMedications = _groupMedicationsByPeriod(MedicationPeriod.morning, medicines);
    final afternoonMedications = _groupMedicationsByPeriod(MedicationPeriod.afternoon, medicines);
    final nightMedications = _groupMedicationsByPeriod(MedicationPeriod.night, medicines);

    return RefreshIndicator(
      onRefresh: () async => bloc.add(MedicationStarted()) ,
      child: ListView(
        children: [
          MedicationPeriodWidget(
            period: MedicationPeriod.morning,
            medications: morningMedications,
          ),
          MedicationPeriodWidget(
            period: MedicationPeriod.afternoon,
            medications: afternoonMedications,
          ),
          MedicationPeriodWidget(
            period: MedicationPeriod.night,
            medications: nightMedications,
          ),
        ],
      ),
    );
  }

  List<Medication> _groupMedicationsByPeriod(MedicationPeriod period, List<Medication> medications) {
    final List<Medication> result = [];

    for (var medicine in medications) {
      final suggestedTimes = medicine.getSuggestedTimes();

      for (var time in suggestedTimes) {
        if (_isInPeriod(time, period)) {
          result.add(medicine);
          break;
        }
      }
    }

    return result;
  }

  bool _isInPeriod(TimeOfDay time, MedicationPeriod period) {
    final int hour = time.hour;

    switch (period) {
      case MedicationPeriod.morning:
        return hour >= 6 && hour < 12;
      case MedicationPeriod.afternoon:
        return hour >= 12 && hour < 18;
      case MedicationPeriod.night:
        return hour >= 18 && hour < 24;
      default:
        return false;
    }
  }
}

class MedicationPeriodWidget extends StatelessWidget {
  const MedicationPeriodWidget({
    super.key,
    required this.period,
    required this.medications,
  });

  final MedicationPeriod period;
  final List<Medication> medications;

  @override
  Widget build(BuildContext context) {
    if (medications.isEmpty) {
      return const Text('Nenhum medicamento cadastrado');
    }

    return Column(
      children: [
        period.buildTile(Theme.of(context).textTheme.titleLarge!),
        const SizedBox(height: 8),
        ...medications.map((medicine) => medicine.buildTile()),
      ],
    );
  }
}

