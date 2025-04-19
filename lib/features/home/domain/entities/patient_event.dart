import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

part '../../presentation/widgets/components/patient_event_tile.dart';

class PatientEvent {
  final PatientEvents eventType;
  final String? title;
  final String description;
  final DateTime? dateTime;

  PatientEvent({
    required this.eventType,
    this.title,
    required this.description,
    this.dateTime,
  });

  PatientEventTile buildTile() {
    return PatientEventTile(this);
  }
}

enum PatientEvents {
  goodMood('bomhumor', Icons.sentiment_very_satisfied_outlined),
  badMood('mauhumor', Icons.sentiment_dissatisfied_outlined),
  location('local', Icons.location_on_outlined),
  appointment('consulta', Icons.event),
  warning('alerta', Icons.warning_amber_outlined),
  medicalTest('exame', Icons.medication_liquid_sharp),
  call('chamada', Icons.call_end_outlined),
  dataGathered('informacoes', Symbols.vital_signs);

  final String description;
  final IconData icon;

  const PatientEvents(
    this.description,
    this.icon,
  );
}
