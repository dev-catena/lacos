import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../../../core/utils/custom_colors.dart';

class IconEmergencyButton extends StatelessWidget {
  const IconEmergencyButton({super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: CustomColor.emergencyButtonColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: const Icon(Symbols.e911_emergency, color: Colors.white),
    );
  }
}
