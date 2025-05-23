import 'package:flutter/material.dart';
import 'package:material_symbols_icons/material_symbols_icons.dart';

import '../../../../core/utils/custom_colors.dart';
import '../../../common/domain/entities/medicine.dart';
import '../../presentation/widgets/components/medication_tile.dart';

class Medication {
  final Medicine medicine;
  final MedicationFrequency frequency;
  final List<UsageInstructions> usageInstructions;
  final TimeOfDay firstDose;
  final bool hasTaken;
  final double? dosage;
  final TreatmentStatus treatmentStatus;
  final DateTime lastUpdate;

  /// Retorna os horários sugeridos com base na frequência e primeiro horário do dia
  List<TimeOfDay> getSuggestedTimes() {
    return frequency.getSuggestedTimes(firstDose);
  }

  Medication copyWith({
    Medicine? medicine,
    MedicationFrequency? frequency,
    List<UsageInstructions>? usageInstructions,
    TimeOfDay? firstDose,
    bool? hasTaken,
    double? dosage,
    TreatmentStatus? treatmentStatus,
    DateTime? lastUpdate,
  }) {
    return Medication(
      medicine: medicine ?? this.medicine,
      frequency: frequency ?? this.frequency,
      usageInstructions: usageInstructions ?? this.usageInstructions,
      firstDose: firstDose ?? this.firstDose,
      hasTaken: hasTaken ?? this.hasTaken,
      dosage: dosage ?? this.dosage,
      treatmentStatus: treatmentStatus ?? this.treatmentStatus,
      lastUpdate: lastUpdate ?? this.lastUpdate,
    );
  }

  Medication({
    required this.medicine,
    required this.frequency,
    required this.firstDose,
    required this.dosage,
    required this.treatmentStatus,
    required this.hasTaken,
    required this.usageInstructions,
    required this.lastUpdate,
  });

  Medication.fromJson(Map<String, dynamic> json)
      : this(
          medicine: Medicine.fromJson(json['medicamento']),
          firstDose: TimeOfDay(
            hour: int.parse((json['primeira_dose'] as String).split(':')[0]),
            minute: int.parse((json['primeira_dose'] as String).split(':')[1]),
          ),
          frequency: MedicationFrequency.fromCode(json['frequencia']),
          treatmentStatus: TreatmentStatus.fromCode(json['status']),
          dosage: json['dosagem'] as double,
          usageInstructions: (json['instrucoes'] as List).map((e) => UsageInstructions.fromCode(e)).toList(),
          hasTaken: json['foi_tomado']== 1 ? true : false,
          lastUpdate: DateTime.parse(json['updated_at']),
        );

  MedicationTile buildTile({required VoidCallback onTap, Widget? trailing}) {
    return MedicationTile(this, onTap: onTap, trailing: trailing);
  }
}

enum UsageInstructions {
  fasted(1, 'Em jejum'),
  beforeMeal(2, 'Antes da refeição'),
  afterMeal(3, 'Após refeição'),
  afterWakeUp(4, 'Ao acordar'),
  beforeSleep(5, 'Antes de dormir');

  final int code;
  final String description;

  factory UsageInstructions.fromCode(int value){
    return UsageInstructions.values.firstWhere((element) => element.code == value);
  }

  const UsageInstructions(this.code, this.description);

  Widget buildTile(final VoidCallback onPressed){
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(description),
          IconButton(onPressed: onPressed, icon: Icon(Icons.remove_circle_outline, color: CustomColor.vividRed)),
        ],
      ),
    );
  }
}

enum MedicationPeriod {
  morning('Manhã', Symbols.wb_twilight),
  afternoon('Tarde', Icons.wb_sunny_outlined),
  night('Noite', Icons.nightlight_outlined);

  final String periodName;
  final IconData icon;

  const MedicationPeriod(this.periodName, this.icon);

  Widget buildTile(TextStyle titleStyle) {
    return Row(
      children: [
        Icon(icon),
        const SizedBox(width: 12),
        Text(
          periodName,
          style: titleStyle,
        ),
      ],
    );
  }
}

enum TreatmentStatus {
  active(1, 'Ativo'),
  treatmentDone(2, 'Finalizado'),
  discontinued(3, 'Descontinuado');

  final int code;
  final String description;

  const TreatmentStatus(this.code, this.description);

  factory TreatmentStatus.fromCode(int code) {
    return TreatmentStatus.values.firstWhere((element) => element.code == code);
  }
}

enum MedicationFrequency {
  singleDose('Dose única', 0),
  every2Hours('A cada 2 horas', 2),
  every4Hours('A cada 4 horas', 4),
  every6Hours('A cada 6 horas', 6),
  every8Hours('A cada 8 horas', 8),
  every12Hours('A cada 12 horas', 12);

  final String description;
  final int hoursInterval;

  const MedicationFrequency(this.description, this.hoursInterval);

  /// Retorna os horários sugeridos com base no primeiro horário do dia
  List<TimeOfDay> getSuggestedTimes(TimeOfDay firstDose) {
    if (this == MedicationFrequency.singleDose) {
      return [firstDose];
    }

    final List<TimeOfDay> times = [];
    TimeOfDay current = firstDose;

    for (int i = 0; i < (24 ~/ hoursInterval); i++) {
      times.add(current);
      current = _addTime(current, Duration(hours: hoursInterval));
    }

    return times;
  }

  TimeOfDay _addTime(TimeOfDay time, Duration duration) {
    final int newHour = (time.hour + duration.inHours) % 24;
    return TimeOfDay(hour: newHour, minute: time.minute);
  }

  factory MedicationFrequency.fromString(String value) {
    return MedicationFrequency.values.firstWhere((element) => element.hoursInterval == int.parse(value));
  }

  factory MedicationFrequency.fromCode(int value) {
    return MedicationFrequency.values.firstWhere((element) => element.hoursInterval == value);
  }
}
