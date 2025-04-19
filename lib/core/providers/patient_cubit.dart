import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

import '../../features/common/data/data_source/user_datasource.dart';
import '../../features/home/patient_profile/data/data_source/doctor_datasource.dart';
import '../../features/home/patient_profile/domain/entities/doctor.dart';

part 'patient_state.dart';

class PatientCubit extends Cubit<PatientState> {
  final DoctorDataSource dataSource;

  PatientCubit(this.dataSource) : super(PatientInitial());

  List<Doctor> get doctors => state is PatientReady ? (state as PatientReady).doctors : [];

  Future<void> initialize(Patient currentPatient) async {
    final List<Doctor> doctors = [];

    await Future.wait([
      dataSource.getPatientDoctors(currentPatient).then((value) => doctors.addAll(value)),
    ]);

    emit(PatientReady(doctors: doctors));
  }

  Future<void> registerDoctor(Patient patient, Doctor doctor) async {
    final internalState = state as PatientReady;
    final doc = await dataSource.registerDoctor(patient, doctor);

    emit(internalState.copyWith(doctors: [...internalState.doctors, doc]));
  }
}
