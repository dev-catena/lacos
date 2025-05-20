import 'package:flutter/material.dart';

import '../../../../common/presentation/widgets/components/stateful_segmented_button.dart';
import '../../../domain/entities/medication.dart';

class TodayUseMedications extends StatefulWidget {
  const TodayUseMedications(this.medicines, {super.key});

  final List<Medication> medicines;

  @override
  State<TodayUseMedications> createState() => _TodayUseMedicationsState();
}

class _TodayUseMedicationsState extends State<TodayUseMedications> {
  List<MedicationsPerPeriodWidget> displayableMeds = [];

  void _filterBy(Set<MedicationPeriod> value) {
    final ordered = MedicationPeriod.values.where((e) => value.contains(e));
    displayableMeds = ordered
        .map((e) => MedicationsPerPeriodWidget(
              period: e,
              medications: _groupMedicationsByPeriod(e, widget.medicines),
            ))
        .toList();
    setState(() {});
  }

  @override
  void initState() {
    _filterBy(MedicationPeriod.values.toSet());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {},
      // onRefresh: () async => bloc.add(MedicationStarted()),
      child: Column(
        children: [
          // Text('Medicações para hoje', style: titleLarge),
          // const SizedBox(height: 4),
          StatefulSegmentedButton<MedicationPeriod>(
            options: MedicationPeriod.values,
            initialSelection: MedicationPeriod.values.toSet(),
            multiSelect: true,
            getLabel: (value) => value.periodName,
            getValue: (value) => value,
            onChanged: _filterBy,
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.separated(
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemCount: displayableMeds.length,
              itemBuilder: (context, index) {
                return displayableMeds[index];
              },
            ),
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
        return hour >= 18 && hour < 24 || hour >= 0 && hour < 6;
      default:
        return false;
    }
  }
}

class MedicationsPerPeriodWidget extends StatelessWidget {
  const MedicationsPerPeriodWidget({
    super.key,
    required this.period,
    required this.medications,
  });

  final MedicationPeriod period;
  final List<Medication> medications;

  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;

    if (medications.isEmpty) {
      // return const Text('Nenhum medicamento cadastrado');
      return const Text('');
    }

    return Column(
      children: [
        period.buildTile(titleMedium),
        const SizedBox(height: 8),
        ...medications.map(
          (medicine) => medicine.buildTile(
            onTap: () {},
            trailing: PopupMenuButton<String>(
              onSelected: (value) async {
                if (value == 'edit') {
                  // showDialog(
                  //     context: context,
                  //     builder: (context) {
                  //       // return CopyPrescriptionDialog(pres, onCreated: (newPrescription) async {
                  //       //   await patientData.registerPrescription(appData.currentPatient!, newPrescription);
                  //       //   setState(() {});
                  //       // });
                  //     });
                } else if (value == 'delete') {
                  // await patientData.deactivatePrescription(appData.currentPatient!, pres);
                  // setState(() {});
                }
              },
              itemBuilder: (context) => const [
                PopupMenuItem(value: 'edit', child: Text('Ver informações')),
                PopupMenuItem(value: 'delete', child: Text('Descontinuar')),
              ],
              // Hide the default icon
              icon: const Icon(Icons.settings),
            ),
          ),
        ),
      ],
    );
  }
}
