import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/routes.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';

class UserProfileScreen extends StatelessWidget {
  const UserProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      child: Column(
        children: [
          ...List.generate(
            UserProfileOption.values.length,
                (index) {
              final option = UserProfileOption.values[index];

              return option.buildTile(context);
            },
          ),
        ],
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

  Widget buildTile(BuildContext context) {
    return ListTile(
      title: Text(description),
      leading: Icon(icon),
      onTap: () {
        context.pushNamed(route);
      },
    );
  }
}
