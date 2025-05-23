import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:flutter/material.dart';

import '../../../../common/domain/entities/medicine.dart';
import '../../../../companion_home/patient_profile/domain/entities/doctor.dart';
import '../../../domain/entities/medication.dart';
import '../../../domain/entities/medication_schedule.dart';
import '../../../domain/entities/prescription.dart';

part 'new_medication_event.dart';

part 'new_medication_state.dart';

class NewMedicationBloc extends Bloc<NewMedicationEvent, NewMedicationState> {
  final Prescription prescription;

  NewMedicationBloc(this.prescription) : super(NewMedicationInitial()) {
    on<NewMedicationStarted>(_onStarted);
    on<NewMedicationDoctorSelected>(_onDoctorSelected);
    on<NewMedicationMedicineSelected>(_onMedicineSelected);
    on<NewMedicationStartChosen>(_onStartChosen);
    on<NewMedicationEndChosen>(_onEndChosen);
    on<NewMedicationContinuousSelected>(_onContinuousSet);
    on<NewMedicationTimeChosen>(_onTimeSet);
    on<NewMedicationFrequencySelected>(_onFrequencySelected);
    on<NewMedicationInstructionAdded>(_onInstructionAdded);
    on<NewMedicationInstructionRemoved>(_onInstructionRemoved);
    on<NewMedicationIntervalSelected>(_onIntervalSelected);
    on<NewMedicationDosageSet>(_onDosageSet);
    on<NewMedicationDurationSet>(_onDurationSet);
  }

  Future<void> _onStarted(NewMedicationStarted event, Emitter<NewMedicationState> emit) async {
    emit(NewMedicationLoadInProgress());
    final List<Medicine> meds = [];

    emit(
      NewMedicationReady(
        prescription: prescription,
        doctorSelected: null,
        medicines: meds,
        medicineSelected: null,
        startDate: null,
        endDate: null,
        isContinuous: false,
        firstDoseTime: null,
        frequencySelected: null,
        instructions: [],
        scheduleType: null,
        scheduleValue: null,
        dosageQuantity: null,
        dosageType: null,
      ),
    );
  }

  void _onDoctorSelected(NewMedicationDoctorSelected event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;
    if (event.doctorSelected == internalState.doctorSelected) {
      emit(internalState.copyWith(doctorSelected: null));
    } else {
      emit(internalState.copyWith(doctorSelected: event.doctorSelected));
    }
  }

  void _onMedicineSelected(NewMedicationMedicineSelected event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    if (event.medicineSelected == internalState.medicineSelected) {
      emit(internalState.copyWith(medicineSelected: null));
    } else {
      emit(internalState.copyWith(medicineSelected: event.medicineSelected));
    }
  }

  void _onStartChosen(NewMedicationStartChosen event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    if (event.date == internalState.startDate || event.date == null) {
      emit(internalState.copyWith(startDate: null));
    } else {
      emit(internalState.copyWith(startDate: event.date));
    }
  }

  void _onEndChosen(NewMedicationEndChosen event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    if (event.date == internalState.endDate || event.date == null) {
      emit(internalState.copyWith(endDate: null));
    } else {
      emit(internalState.copyWith(endDate: event.date));
    }
  }

  void _onContinuousSet(NewMedicationContinuousSelected event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    emit(internalState.copyWith(isContinuous: event.isContinuous));
  }

  void _onTimeSet(NewMedicationTimeChosen event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    if (event.time == internalState.firstDoseTime || event.time == null) {
      emit(internalState.copyWith(firstDoseTime: null));
    } else {
      emit(internalState.copyWith(firstDoseTime: event.time));
    }
  }

  void _onFrequencySelected(NewMedicationFrequencySelected event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    if (event.frequency == internalState.frequencySelected) {
      emit(internalState.copyWith(firstDoseTime: null));
    } else {
      emit(internalState.copyWith(frequencySelected: event.frequency));
    }
  }

  void _onInstructionAdded(NewMedicationInstructionAdded event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    final instructions = List<UsageInstructions>.of(internalState.instructions);

    instructions.add(event.instruction);

    emit(internalState.copyWith(instructions: instructions));
  }

  void _onInstructionRemoved(NewMedicationInstructionRemoved event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    final instructions = List<UsageInstructions>.of(internalState.instructions);

    instructions.remove(event.instruction);

    emit(internalState.copyWith(instructions: instructions));
  }

  void _onIntervalSelected(NewMedicationIntervalSelected event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;
    final MedicationScheduleType type = event.type;
    final dynamic value = event.value;

    emit(internalState.copyWith(scheduleType: type, scheduleValue: value));
  }

  void _onDosageSet(NewMedicationDosageSet event, Emitter<NewMedicationState> emit) {
    final internState = state as NewMedicationReady;

    emit(internState.copyWith(dosageType: event.type, dosageQuantity: event.value));
  }

  void _onDurationSet(NewMedicationDurationSet event, Emitter<NewMedicationState> emit) {
    final internState = state as NewMedicationReady;

    emit(internState.copyWith(startDate: event.start, endDate: event.end, isContinuous: event.isContinuous));
  }
}
