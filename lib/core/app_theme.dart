import 'package:flutter/material.dart';

import 'utils/custom_colors.dart';

class AppTheme {
  ThemeData getAppTheme(BuildContext context) {
    return ThemeData(
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: CustomColor.bottomBarBg
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      )
    );
  }
}
