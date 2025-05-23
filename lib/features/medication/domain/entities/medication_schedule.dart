import 'package:flutter/material.dart';

class MedicationSchedule {
  final MedicationScheduleType type;

  // For interval
  final Duration? interval;
  final DateTime? startDate;

  // For daily/weekly
  final List<TimeOfDay>? times;
  final List<int>? weekdays;

  // For cyclic
  final int? onWeeks;
  final int? offWeeks;

  // For monthly
  final int? everyXMonths; // e.g. 2 for "every 2 months"
  final int? dayOfMonth; // e.g. 5th or 15th

  MedicationSchedule({
    required this.type,
    this.interval,
    this.startDate,
    this.times,
    this.weekdays,
    this.onWeeks,
    this.offWeeks,
    this.everyXMonths,
    this.dayOfMonth,
  });
}

enum MedicationScheduleType {
  /// a cada X horas
  interval(1, ' A cada X horas'),
  /// em um horário específico
  daily(1, 'Uma vez ao dia'),
  /// dias especificos da semana (eg. seg, quarta, sexta)
  weekly(1, 'Dias da semana'),
  /// on/off ciclo semanal
  cyclicWeekly(1, 'Ciclíco'),
  /// a cada X meses
  monthly(5, 'Mensal');

  final int code;
  final String description;

  const MedicationScheduleType(this.code, this.description);
}
