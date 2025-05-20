import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

part '../../presentation/widgets/components/patient_event_tile.dart';

class PatientEvent {
  final int id;
  final PatientEventType eventType;
  final String? title;
  final String description;
  final DateTime? dateTime;

  PatientEvent copyWith({
    int? id,
    PatientEventType? eventType,
    String? title,
    String? description,
    DateTime? dateTime,
  }) {
    return PatientEvent(
      id: id ?? this.id,
      eventType: eventType ?? this.eventType,
      title: title ?? this.title,
      description: description ?? this.description,
      dateTime: dateTime ?? this.dateTime,
    );
  }

  PatientEvent({
    required this.id,
    required this.eventType,
    this.title,
    required this.description,
    this.dateTime,
  });

  PatientEventTile buildTile() {
    return PatientEventTile(this);
  }
}

enum PatientEventType {
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

  const PatientEventType(
    this.description,
    this.icon,
  );

  Widget buildSelector(bool isSelected, ValueChanged<PatientEventType> onSelect) {
    return ChoiceChip(
      label: Text(description),
      selected: isSelected,
      onSelected: (_) => onSelect(this),
    );
  }
}
