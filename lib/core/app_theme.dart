import 'package:flutter/material.dart';

import 'utils/custom_colors.dart';

class AppTheme {
  ThemeData getAppTheme(BuildContext context) {
    return ThemeData(
      floatingActionButtonTheme: const FloatingActionButtonThemeData(backgroundColor: CustomColor.bottomBarBg),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith<Color>((states) {
            if (states.contains(WidgetState.selected)) {
              return CustomColor.activeColor;
            } else {
              return Colors.transparent;
            }
          }),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.all(CustomColor.darkActiveColor),
          foregroundColor: WidgetStateProperty.all(Colors.white),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          foregroundColor: WidgetStateProperty.all(CustomColor.vividRed),
          side: WidgetStateProperty.all(const BorderSide(color: CustomColor.vividRed)),
        ),
      ),
      tabBarTheme: const TabBarTheme(
        labelColor: CustomColor.bottomBarIcon,
        indicatorColor: CustomColor.bottomBarIcon,
      )
    );
  }
}
