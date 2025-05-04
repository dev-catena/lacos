import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:flutter/material.dart';

import '../../../../common/domain/entities/medicine.dart';
import '../../../../companion_home/patient_profile/domain/entities/doctor.dart';
import '../../../domain/entities/medication.dart';
import '../../../domain/entities/prescription.dart';

part 'new_medication_event.dart';

part 'new_medication_state.dart';

class NewMedicationBloc extends Bloc<NewMedicationEvent, NewMedicationState> {
  final Prescription prescription;

  NewMedicationBloc(this.prescription) : super(NewMedicationInitial()) {
    on<NewMedicationStarted>(_onStarted);
    on<NewMedicationDoctorSelected>(_onDoctorSelected);
    on<NewMedicationMedicineSelected>(_onMedicineSelected);
    on<NewMedicationConcentrationSelected>(_onConcentrationSelected);
    on<NewMedicationStartChosen>(_onStartChosen);
    on<NewMedicationEndChosen>(_onEndChosen);
    on<NewMedicationContinuousSelected>(_onContinuousSet);
    on<NewMedicationTimeChosen>(_onTimeSet);
    on<NewMedicationFrequencySelected>(_onFrequencySelected);
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
        concentrationSelected: null,
        startDate: null,
        endDate: null,
        isContinuous: false,
        firstDoseTime: null,
        frequencySelected: null,
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

  void _onConcentrationSelected(NewMedicationConcentrationSelected event, Emitter<NewMedicationState> emit) {
    final internalState = state as NewMedicationReady;

    if (event.concentrationSelected == internalState.concentrationSelected) {
      emit(internalState.copyWith(concentrationSelected: null));
    } else {
      emit(internalState.copyWith(concentrationSelected: event.concentrationSelected));
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

    if (event.frequency == internalState.frequencySelected ) {
      emit(internalState.copyWith(firstDoseTime: null));
    } else {
      emit(internalState.copyWith(frequencySelected: event.frequency));
    }

  }
}
