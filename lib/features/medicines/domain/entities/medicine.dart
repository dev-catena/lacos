import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:material_symbols_icons/material_symbols_icons.dart';

import '../../presentation/widgets/components/medicine_tile.dart';

enum UsageInstructions {
  jejum;
}

class Medicine extends Equatable {
  final String name;
  final MedicineType type;
  final String description;
  final double dosage; // mg/ml por dose
  final MedicineFrequency frequency;
  final List<UsageInstructions>? usageInstructions;
  final TimeOfDay firstDose;
  final bool? hasTaken;

  const Medicine({
    required this.name,
    required this.type,
    required this.description,
    required this.dosage,
    required this.frequency,
    required this.firstDose,
    this.usageInstructions,
    this.hasTaken,
  });

  MedicineTile buildTile() {
    return MedicineTile(this);
  }

  /// Retorna os horários sugeridos com base na frequência e primeiro horário do dia
  List<TimeOfDay> getSuggestedTimes() {
    return frequency.getSuggestedTimes(firstDose);
  }

  @override
  List<Object?> get props => [
        name,
        type,
        description,
        dosage,
        frequency,
        firstDose,
        usageInstructions,
      ];

  @override
  String toString() {
    return 'Medicine(name: $name, type: $type, dosage: $dosage mg, frequency: ${frequency.description}, firstDose: ${firstDose.hour}:${firstDose.minute})';
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

enum MedicineType {
  pill('Comprimido', Symbols.pill), // Pílula/comprimido
  ointment('Pomada', Icons.wash), // Pomada
  syrup('Xarope', Symbols.glass_cup), // Xarope
  oralDrops('Gotas', Icons.water_drop), // Gotas orais
  injection('Injeção', Icons.vaccines); // Injeção

  final String description;
  final IconData icon;

  const MedicineType(this.description, this.icon);
}

enum MedicineFrequency {
  singleDose('Dose única', 0),
  every4Hours('A cada 4 horas', 4),
  every6Hours('A cada 6 horas', 6),
  every8Hours('A cada 8 horas', 8),
  every12Hours('A cada 12 horas', 12);

  final String description;
  final int hoursInterval;

  const MedicineFrequency(this.description, this.hoursInterval);

  /// Retorna os horários sugeridos com base no primeiro horário do dia
  List<TimeOfDay> getSuggestedTimes(TimeOfDay firstDose) {
    if (this == MedicineFrequency.singleDose) {
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
}
