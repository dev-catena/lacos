import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../../core/providers/user_cubit.dart';
import '../../../../../core/routes.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';

class UserProfileScreen extends StatelessWidget {
  const UserProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userData = context.read<UserCubit>();

    return CustomScaffold(
      child: BlocBuilder<UserCubit, UserState>(
        builder: (context, state) {
          return Column(
            children: [
              Text('toekn ${userData.user?.googleAccount?.id}'),

              ...List.generate(
                UserProfileOption.values.length,
                    (index) {
                  final option = UserProfileOption.values[index];

                  void function() {
                    if (option.description == 'Sair') {
                      // TODO Verificar esse ignore lints
                      // ignore: use_build_context_synchronously
                      GoogleSignIn().signOut().whenComplete(() => context.goNamed(AppRoutes.loginScreen));
                    } else {
                      context.pushNamed(option.route);
                    }
                  }

                  return option.buildTile(function);
                },
              ),
            ],
          );
        },
      ),
    );
  }
}


enum UserProfileOption {
  information('Informações do usuário', 'route', Icons.account_circle_outlined),
  access('Perfil de acesso', AppRoutes.groupSelectionScreen, Icons.manage_accounts_outlined),
  logout('Sair', 'route', Icons.logout_outlined);

  final String description;
  final String route;
  final IconData icon;

  const UserProfileOption(this.description, this.route, this.icon);

  Widget buildTile(VoidCallback onTap) {
    return ListTile(
      title: Text(description),
      leading: Icon(icon),
      onTap: onTap,
    );
  }
}
