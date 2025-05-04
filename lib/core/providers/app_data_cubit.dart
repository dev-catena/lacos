import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

import '../../features/common/data/data_source/medicine_datasource.dart';
import '../../features/common/domain/entities/medicine.dart';

part 'app_data_state.dart';

class AppDataCubit extends Cubit<AppDataState> {
  final MedicineDataSource medicineDataSource;

  AppDataCubit(this.medicineDataSource) : super(AppDataInitial());

  List<Medicine>? get medicines => state is AppDataReady ? (state as AppDataReady).medicines : null;

  void initialize() {
    final meds = medicineDataSource.getMedicines();

    emit(AppDataReady(medicines: meds));
  }

  void addMedicine(Medicine med) {
    final currentState = state as AppDataReady;

    emit(AppDataReady(medicines: [...currentState.medicines, med]));
  }
}
