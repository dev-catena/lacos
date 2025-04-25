import '../../../medication/domain/entities/medication.dart';

class MedicineDataSource {
  List<Medicine> getMedicines() {
    final List<Medicine> medicines = [
      Medicine(
        name: 'Paracetamol',
        type: MedicineType.pill,
        description: 'Analgésico e antitérmico',
        dosage: 500.0,
      ),
      Medicine(
        name: 'Xarope para Tosse',
        type: MedicineType.syrup,
        description: 'Alivia a tosse e descongestiona',
        dosage: 10.0,
      ),
      Medicine(
        name: 'Xarope',
        type: MedicineType.syrup,
        description: 'Alivia a tosse',
        dosage: 10.0,
      ),
      Medicine(
        name: 'Pomada Anti-inflamatória',
        type: MedicineType.ointment,
        description: 'Reduz a inflamação e alivia a dor nas articulações',
        dosage: 2.0,
      ),
      Medicine(
        name: 'Vitamina C',
        type: MedicineType.pill,
        description: 'Fortalece o sistema imunológico',
        dosage: 1000.0,
      ),
    ];
    return medicines;
  }
}
