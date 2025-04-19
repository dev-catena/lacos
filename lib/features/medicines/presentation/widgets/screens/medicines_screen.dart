part of '../../blocs/medication_bloc.dart';

class MedicinesScreen extends StatefulWidget {
  const MedicinesScreen({super.key});

  @override
  MedicinesScreenState createState() => MedicinesScreenState();
}

class MedicinesScreenState extends State<MedicinesScreen> with SingleTickerProviderStateMixin {
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
    final bloc = context.read<MedicationBloc>();

    return CustomScaffold(
      tabBar: TabBar(
        controller: _tabController,
        tabs: const [
          Tab(text: 'Em uso'),
          Tab(text: 'Histórico'),
          Tab(text: 'Descontinuados'),
        ],
        onTap: (_) => setState(() {}),
      ),
      isScrollable: false,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.pushNamed(AppRoutes.newMedicineScreen);
        },
        child: const Icon(Icons.add),
      ),
      child: BlocBuilder<MedicationBloc, MedicationState>(
        builder: (_, state) {

          Widget getScreen(){
            if (state is MedicinesInitial) {
              bloc.add(MedicationStarted());
              return const CircularProgressIndicator();
            } else if (state is MedicinesLoadInProgress) {
              bloc.add(MedicationStarted());
              return const CircularProgressIndicator();
            } else if (state is MedicinesReady) {
              return _ReadyScreen(state, _tabController);
            } else {
              return Column(
                children: [
                  const Text('No state'),
                  IconButton(
                    onPressed: () => bloc.add(MedicationStarted()),
                    icon: const Icon(Icons.refresh_outlined),
                  ),
                ],
              );
            }
          }

          return getScreen();
        },
      ),
    );
  }
}

class _ReadyScreen extends StatelessWidget {
  const _ReadyScreen(this.state, this.tabController);

  final MedicinesReady state;
  final TabController tabController;

  @override
  Widget build(BuildContext context) {
    return TabBarView(
      controller: tabController,
      children: [
        TodayUseMedications(state.medicines),
        const Text('tab2'),
        const Text('tab3'),
      ],
    );
  }
}
