import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'providers/app_data_cubit.dart';
import 'providers/user_cubit.dart';
import 'utils/custom_colors.dart';

final scaffoldKey = GlobalKey<ScaffoldState>();

class ScaffoldWithNestedNavigation extends StatefulWidget {
  const ScaffoldWithNestedNavigation({
    Key? key,
    required this.navigationShell,
  }) : super(key: key ?? const ValueKey('ScaffoldWithNestedNavigation'));
  final StatefulNavigationShell navigationShell;

  @override
  State<ScaffoldWithNestedNavigation> createState() => _ScaffoldWithNestedNavigationState();
}

class _ScaffoldWithNestedNavigationState extends State<ScaffoldWithNestedNavigation> {
  void _goBranch(int index) {
    widget.navigationShell.goBranch(
      index,
      /// Quando o usuário aperta no ícone da branch que ele já está, ele é direcionado para a initialLocation da branch
      initialLocation: index == widget.navigationShell.currentIndex,
    );
  }

  final companionDestination = const [
    NavigationDestination(label: 'Histórico', icon: Icon(Icons.assignment_outlined)),
    NavigationDestination(label: 'Remédios', icon: Icon(Icons.medication_outlined)),
    NavigationDestination(label: 'Agenda', icon: Icon(Icons.calendar_month_outlined)),
    NavigationDestination(label: 'Conversas', icon: Icon(Icons.chat_outlined)),
    NavigationDestination(label: 'Arquivo', icon: Icon(Icons.folder_outlined)),
  ];

  final patientDestination = const [
    NavigationDestination(label: 'Inicial', icon: Icon(Icons.home_outlined)),
    NavigationDestination(label: 'Remédios', icon: Icon(Icons.medication_outlined)),
    NavigationDestination(label: 'Agenda', icon: Icon(Icons.calendar_month_outlined)),
    NavigationDestination(label: 'Conversas', icon: Icon(Icons.chat_outlined)),
  ];

  @override
  Widget build(BuildContext context) {
    final userData = context.read<UserCubit>();


    return Scaffold(
      key: scaffoldKey,
      body: widget.navigationShell,
      bottomNavigationBar: NavigationBar(
        backgroundColor: CustomColor.bottomBarBg,
        selectedIndex: widget.navigationShell.currentIndex,
        indicatorColor: CustomColor.activeBottomBarBgIcon,
        destinations: userData.user!.isPatient ? patientDestination : companionDestination,
        onDestinationSelected: _goBranch,
      ),
    );
  }
}
