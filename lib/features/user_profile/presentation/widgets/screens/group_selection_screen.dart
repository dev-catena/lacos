import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/utils/custom_colors.dart';
import '../../../../../core/providers/user_cubit.dart';
import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../../common/presentation/widgets/dialogs/single_select_dialog.dart';

class GroupSelectionScreen extends StatelessWidget {
  const GroupSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final titleLarge = Theme.of(context).textTheme.titleLarge!;
    final titleMedium = Theme.of(context).textTheme.titleMedium!;
    final userCubit = context.read<UserCubit>();

    return CustomScaffold(
      child: BlocBuilder<UserCubit, UserState>(
        builder: (context, state) {
          if (state is UserReady) {
            final userLoggedIn = state.userLoggedIn;
            final accessType = state.currentAccessType;

            return Column(
              children: [
                Text('Bem vindo, ${userLoggedIn.fullName}', textAlign: TextAlign.center, style: titleMedium),
                const SizedBox(height: 10),
                Text('Perfil de acesso:', style: titleMedium),
                CustomSelectableTile(
                  title: accessType.description,
                  titleColor: Colors.black,
                  isActive: true,
                  onTap: () {
                    showDialog(
                        context: context,
                        builder: (_) {
                          return SingleSelectDialog<AccessProfileType>(
                            title: 'Selecione seu perfil de acesso',
                            options: userLoggedIn.accessProfileTypes,
                            getName: (option) => option.description,
                            onChoose: (value) {
                              userCubit.setDefaultAccessType(value);
                            },
                            optionSelected: accessType,
                          );
                        });
                  },
                ),
                const SizedBox(height: 20),
                Text(getText(accessType), style: titleLarge),
                getAccessScreen(context, accessType),
              ],
            );
          } else {
            return const Text('No state');
          }
        },
      ),
    );
  }
}

String getText(AccessProfileType profile) {
  final String text;
  switch (profile) {
    case AccessProfileType.patient:
      text = '';
    case AccessProfileType.companion:
      text = 'Acompanhados';
    case AccessProfileType.caregiver:
      text = 'Sob cuidados';
  }

  return text;
}

Widget getAccessScreen(BuildContext context, AccessProfileType profile) {
  final displaySmall = Theme.of(context).textTheme.displaySmall!;
  final userData = context.read<UserCubit>().state as UserReady;

  switch (profile) {
    case AccessProfileType.patient:
      return Container(
        height: 140,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: CustomColor.activeBottomBarBgIcon),
          color: CustomColor.bottomBarBg,
        ),
        child: Center(
            child: Text(
          'Ir para minha tela',
          style: displaySmall,
        )),
      );
    case AccessProfileType.companion:
      return Column(
        children: [
          ...List.generate(
            userData.patients.length,
            (index) {
              final patient = userData.patients[index];

              return Padding(
                padding: const EdgeInsets.only(bottom: 15),
                child: patient.buildGroupCard(),
              );
            },
          ),
        ],
      );
    case AccessProfileType.caregiver:
      return Column(
        children: [
          ...List.generate(
            userData.patients.length,
            (index) {
              final patient = userData.patients[index];
              return patient.buildGroupCard();
            },
          ),
        ],
      );
  }
}

enum AccessProfileType {
  patient(1, 'Paciente'),
  companion(2, 'Acompanhante'),
  caregiver(3, 'Cuidador');

  final int code;
  final String description;

  static List<AccessProfileType> fromIntList(List<int> accesses) {
    final List<AccessProfileType> profiles = [];
    for (final ele in accesses) {
      profiles.add(AccessProfileType.values.firstWhere((element) => element.code == ele));
    }
    return profiles;
  }

  factory AccessProfileType.fromCode(int code) {
    switch (code) {
      case 1:
        return AccessProfileType.patient;
      case 2:
        return AccessProfileType.companion;
      case 3:
        return AccessProfileType.caregiver;
      default:
        return AccessProfileType.companion;
    }
  }

  const AccessProfileType(this.code, this.description);
}
