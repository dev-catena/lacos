
import '../../../companion_home/domain/entities/patient_event.dart';
import '../../../companion_home/patient_profile/domain/entities/doctor.dart';
import '../../../medication/domain/entities/medication.dart';
import '../../data/data_source/user_datasource.dart';
import '../../data/models/user_model.dart';
import 'user.dart';

class Patient {
  final UserEntity self;
  final List<UserEntity> usersForPatient;
  final List<Doctor>? doctors;
  final List<Medication> medications;
  final String groupCode;
  final GroupStatus status;

  Patient({
    required this.self,
    required this.usersForPatient,
    this.doctors,
    required this.medications,
    required this.groupCode,
    required this.status,
  });

  Patient.fromJson(Map<String, dynamic> json)
      : this(
    self: UserModel.fromJson(json['paciente']),
    usersForPatient: (json['cuidadores'] as List? ?? []).map((e) => UserModel.fromJson(e)).toList(),
    medications: (json['medicacoes'] as List? ?? []).map((e) => Medication.fromJson(e)).toList(),
    groupCode: json['codigo'],
    status: GroupStatus.fromCode(json['status']),
  );

  PatientResumeCard buildResumeCard(List<PatientEvent> events) {
    return PatientResumeCard(this, events: events);
  }

  PatientGroupCard buildGroupCard() {
    return PatientGroupCard(this);
  }
}