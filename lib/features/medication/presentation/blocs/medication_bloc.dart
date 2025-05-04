import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/patient_cubit.dart';
import '../../../../core/providers/user_cubit.dart';
import '../../../../core/routes.dart';
import '../../../common/presentation/widgets/custom_scaffold.dart';
import '../../data/medication_datasource.dart';
import '../../domain/entities/medication.dart';
import '../widgets/components/today_use_medications.dart';

part 'medication_event.dart';
part 'medication_state.dart';
part '../widgets/screens/medications_screen.dart';

class MedicationBloc extends Bloc<MedicationEvent, MedicationState> {
  final UserCubit userData;

  MedicationBloc(this.userData) : super(MedicationInitial()) {
    on<MedicationStarted>(_onStarted);
  }

  Future<void> _onStarted(event, emit) async {
    emit(MedicationLoadInProgress());
    final List<Medication> medications = userData.currentPatient!.medications;

    await Future.wait([
      // dataSource.getMedications().then((value) => medications.addAll(value)),
    ]);

    emit(MedicationReady(medications: medications));

  }
}
