import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/providers/patient_cubit.dart';
import '../../../../../core/routes.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../domain/entities/medication.dart';
import '../components/discontinued_medication_tab.dart';
import '../components/medication_historic_tab.dart';
import '../components/today_use_medications_tab.dart';

class MedicationsScreen extends StatefulWidget {
  const MedicationsScreen({super.key});

  @override
  MedicationsScreenState createState() => MedicationsScreenState();
}

class MedicationsScreenState extends State<MedicationsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this); // Create TabController
  }

  @override
  void dispose() {
    _tabController.dispose(); // Dispose TabController when done
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final patientData = context.watch<PatientCubit>();

    final medications = patientData.prescriptions.expand((element) => element.medications);

    return CustomScaffold(
      tabBar: TabBar(
        controller: _tabController,
        tabs: const [
          Tab(text: 'Em uso'),
          Tab(text: 'Concluídos'),
          Tab(text: 'Descontinuados'),
        ],
        onTap: (_) => setState(() {}),
      ),
      isScrollable: false,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.pushNamed(AppRoutes.prescriptionPanelScreen);
        },
        child: const Icon(Icons.settings),
      ),
      child: TabBarView(
        controller: _tabController,
        children: [
          TodayUseMedications(
            medications.where((element) => element.treatmentStatus == TreatmentStatus.active).toList(),
          ),
          MedicationHistoricTab(
            medications.where((element) => element.treatmentStatus == TreatmentStatus.treatmentDone).toList(),
          ),
          DiscontinuedMedicationTab(
            medications.where((element) => element.treatmentStatus == TreatmentStatus.discontinued).toList(),
          ),
        ],
      ),
    );
  }
}
