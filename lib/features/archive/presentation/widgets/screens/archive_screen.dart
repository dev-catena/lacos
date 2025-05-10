import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/routes.dart';
import '../../../../../core/utils/custom_colors.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';

class ArchiveScreen extends StatelessWidget {
  const ArchiveScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final List<FeatureData> data = [
      FeatureData(title: 'Receitas', icon: Icons.receipt_long_outlined, route: AppRoutes.prescriptionArchive),
    ];
    final displaySmall = Theme.of(context).textTheme.displaySmall!;

    return CustomScaffold(
      child: Column(
        children: [
          Text('Arquivo', style: displaySmall),
          const SizedBox(height: 20),
          SizedBox(
            height: 200,
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(maxCrossAxisExtent: 200),
              itemCount: data.length,
              itemBuilder: (context, index) {
                final feature = data[index];

                return FeatureCard(feature);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class FeatureData{
  final String title;
  final IconData icon;
  final String route;

  FeatureData({required this.title, required this.icon, required this.route});
}

class FeatureCard extends StatelessWidget {
  const FeatureCard(this.data, {super.key});

  final FeatureData data;

  @override
  Widget build(BuildContext context) {
    final titleLarge = Theme.of(context).textTheme.titleLarge!;
    final borderRadius = BorderRadius.circular(16);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: borderRadius,
        onTap: () => context.pushNamed(data.route),
        child: Container(
          height: 80,
          width: 80,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade500),
            borderRadius: borderRadius,
            color: CustomColor.activeColor.withAlpha(155)
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(data.title, style: titleLarge),
              const SizedBox(height: 20),
              Icon(data.icon, size: 40),
            ],
          ),
        ),
      ),
    );
  }
}

