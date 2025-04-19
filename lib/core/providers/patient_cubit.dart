import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

import '../../features/common/data/data_source/user_datasource.dart';
import '../../features/home/patient_profile/data/data_source/doctor_datasource.dart';
import '../../features/home/patient_profile/domain/entities/doctor.dart';

part 'doctor_for_patient_state.dart';

class PatientCubit extends Cubit<PatientState> {
  final Patient? patient;
  final DoctorDataSource dataSource;

  PatientCubit(this.patient, this.dataSource) : super(PatientInitial());
}
