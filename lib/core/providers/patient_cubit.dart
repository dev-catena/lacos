import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

import '../../features/common/data/data_source/medication_data_source.dart';
import '../../features/common/domain/entities/patient.dart';
import '../../features/companion_home/patient_profile/data/data_source/doctor_datasource.dart';
import '../../features/companion_home/patient_profile/domain/entities/doctor.dart';
import '../../features/medication/domain/entities/medication.dart';
import '../../features/medication/domain/entities/prescription.dart';

part 'patient_state.dart';

class PatientCubit extends Cubit<PatientState> {
  final DoctorDataSource doctorsDataSource;
  final MedicationDataSource medicationDataSource;

  PatientCubit(this.doctorsDataSource, this.medicationDataSource) : super(PatientInitial());

  List<Doctor> get doctors => state is PatientReady ? (state as PatientReady).doctors : [];
  List<Prescription> get prescriptions => state is PatientReady ? (state as PatientReady).prescription : [];

  Future<void> initialize(Patient currentPatient) async {
    final List<Doctor> doctors = [];
    final List<Prescription> prescription = [];

    await Future.wait([
      doctorsDataSource.getPatientDoctors(currentPatient).then((value) => doctors.addAll(value)),
      medicationDataSource.getPrescriptionForPatient(currentPatient).then((value) => prescription.addAll(value)),
    ]);

    emit(PatientReady(doctors: doctors, prescription: prescription));
  }

  Future<void> registerDoctor(Patient patient, Doctor doctor) async {
    final internalState = state as PatientReady;
    final doc = await doctorsDataSource.registerDoctor(patient, doctor);

    emit(internalState.copyWith(doctors: [...internalState.doctors, doc]));
  }

  Future<void> registerPrescription(Patient patient, Prescription pres) async {
    final internalState = state as PatientReady;
    final prescription = await medicationDataSource.registerPrescription(patient, pres);

    emit(internalState.copyWith(prescription: [...internalState.prescription, prescription]));
  }

  Future<void> deactivatePrescription(Patient patient, Prescription pres) async {
    final internalState = state as PatientReady;
    final updatedPrescriptions = List.of(internalState.prescription);
    final prescription = await medicationDataSource.deactivatePrescription(patient, pres);

    final index = updatedPrescriptions.indexOf(pres);

    updatedPrescriptions.removeAt(index);
    updatedPrescriptions.insert(index, prescription);

    emit(internalState.copyWith(prescription: [...updatedPrescriptions]));
  }


  Future<void> deactivateMedication(Patient patient, Prescription pres, Medication med) async {
    final internalState = state as PatientReady;

    final presList = List.of(internalState.prescription);

    final presIndex = presList.indexOf(pres);
    presList.removeAt(presIndex);

    final updatedPrescription = pres;


    final index = updatedPrescription.medications.indexOf(med);

    final updatedMedication = await medicationDataSource.deactivateMedication(patient, med);

    updatedPrescription.medications.removeAt(index);
    updatedPrescription.medications.add(updatedMedication);

    presList.insert(presIndex, updatedPrescription);

    emit(internalState.copyWith(prescription: [...presList]));
  }

  Future<void> reactivateMedication(Patient patient, Prescription pres, Medication med) async {
    final internalState = state as PatientReady;

    final presList = List.of(internalState.prescription);

    final presIndex = presList.indexOf(pres);
    presList.removeAt(presIndex);

    final updatedPrescription = pres;


    final index = updatedPrescription.medications.indexOf(med);

    final updatedMedication = await medicationDataSource.reactivateMedication(patient, med);

    updatedPrescription.medications.removeAt(index);
    updatedPrescription.medications.add(updatedMedication);

    presList.insert(presIndex, updatedPrescription);

    emit(internalState.copyWith(prescription: [...presList]));
  }
}
