import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../common/presentation/widgets/custom_scaffold.dart';
import '../../data/medication_datasource.dart';
import '../../domain/entities/medicine.dart';
import '../widgets/components/today_use_medications.dart';

part 'medication_event.dart';
part 'medication_state.dart';
part '../widgets/screens/medicines_screen.dart';

class MedicationBloc extends Bloc<MedicationEvent, MedicationState> {
  final MedicationDataSource dataSource;
  MedicationBloc(this.dataSource) : super(MedicinesInitial()) {
    on<MedicationStarted>(_onStarted);
  }

  Future<void> _onStarted(event, emit) async {
    emit(MedicinesLoadInProgress());
    final List<Medicine> medicines = [];

    await Future.wait([
      dataSource.getMedicines().then((value) => medicines.addAll(value)),
    ]);

    emit(MedicinesReady(medicines: medicines));

  }
}
