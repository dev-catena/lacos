import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

import '../../data/prescription_datasource.dart';
import '../../domain/entities/prescription.dart';

part 'prescription_event.dart';

part 'prescription_state.dart';

class PrescriptionBloc extends Bloc<PrescriptionEvent, PrescriptionState> {
  final PrescriptionDataSource dataSource;
  PrescriptionBloc(this.dataSource) : super(PrescriptionInitial()) {
    on<PrescriptionStarted>(_onStarted);
    on<PrescriptionRegistered>(_onRegistered);
  }

  Future<void> _onStarted(PrescriptionStarted event, Emitter<PrescriptionState> emit) async {
    emit(PrescriptionLoadInProgress());

    final List<Prescription> pres = [];

    Future.wait([
      dataSource.getPrescriptionForPatient().then((value) => pres.addAll(value)),
    ]);

    emit(PrescriptionReady(prescriptions: pres));

  }

  void _onRegistered(PrescriptionRegistered event, Emitter<PrescriptionState> emit) {
    final internState = state as PrescriptionReady;

    final pres = List<Prescription>.of(internState.prescriptions);
    pres.add(event.newPrescription);

    emit(internState.copyWith(prescriptions: pres));
  }
}
