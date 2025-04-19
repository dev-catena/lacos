import 'package:flutter/material.dart';
import '../../../../../core/utils/custom_colors.dart';
import 'package:material_symbols_icons/material_symbols_icons.dart';

class EmergencyButton extends StatelessWidget {
  const EmergencyButton({super.key});

  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;

    return IntrinsicWidth(
      child: FilledButton(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.all(CustomColor.emergencyButtonColor),
        ),
        onPressed: () {},
        child: Row(
          children: [
            const Icon(
              Symbols.e911_emergency,
              size: 30,
            ),
            const SizedBox(width: 20),
            Text('Emergência!', style: titleMedium.copyWith(color: Colors.white)),
          ],
        ),
      ),
    );
  }
}
