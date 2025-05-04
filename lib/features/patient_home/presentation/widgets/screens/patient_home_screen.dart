import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../core/providers/user_cubit.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';

class PatientHomeScreen extends StatelessWidget {
  const PatientHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final images = [
      'https://picsum.photos/200/300',
      'https://picsum.photos/240/340',
      'https://picsum.photos/210/310',
      'https://picsum.photos/220/320',
    ];

    final userData = context.read<UserCubit>();
    final headlineSmall = Theme.of(context).textTheme.headlineSmall!;

    return CustomScaffold(
      child: Column(
        children: [
          SizedBox(
            height: 200,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              separatorBuilder: (context, index) {
                return const SizedBox(width: 20);
              },
              itemBuilder: (context, index) {
                return Image.network(images[index]);
              },
            ),
          ),
          const SizedBox(height: 12),
          Text('Contatos', style: headlineSmall),
          const SizedBox(height: 6),
          Flex(
            direction: Axis.horizontal,
            children: List.generate(
              userData.currentPatient!.usersForPatient.length,
              (index) {
                final user = userData.currentPatient!.usersForPatient[index];

                return Container(
                  height: 150,
                  width: 150,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Stack(
                      children: [
                        Image.network(user.photoPath),
                        Positioned(
                          left: 10,
                          bottom: 20,
                          child: Text(
                            user.fullName.split(' ')[0],
                            style: headlineSmall.copyWith(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
