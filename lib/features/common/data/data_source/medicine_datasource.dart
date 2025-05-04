import '../../domain/entities/medicine.dart';

class MedicineDataSource {
  List<Medicine> getMedicines() {
    final rawData = _MockData().medicines;
    final List<Medicine> meds = [];

    for(final ele in rawData){
      meds.add(Medicine.fromJson(ele));
    }

    return meds;
  }
}

class _MockData {
  final medicines = [
    {
      'id': 0,
      'nome': 'Paracetamol',
      'tipo': 1,
      'descricao': 'Analgésico e antitérmico',
      'dosagem': '500.0'
    },
    {
      'id': 1,
      'nome': 'Xarope para Tosse',
      'tipo': 3,
      'descricao': 'Alivia a tosse e descongestiona',
      'dosagem': '10.0'
    },
    {
      'id': 2,
      'nome': 'Xarope',
      'tipo': 3,
      'descricao': 'Alivia a tosse',
      'dosagem': '10.0'
    },
    {
      'id': 3,
      'nome': 'Pomada Anti-inflamatória',
      'tipo': 2,
      'descricao': 'Reduz a inflamação e alivia a dor nas articulações',
      'dosagem': '2.0'
    },
    {
      'id': 4,
      'nome': 'Vitamina C',
      'tipo': 1,
      'descricao': 'Fortalece o sistema imunológico',
      'dosagem': '1000.0'
    }
  ];
}
