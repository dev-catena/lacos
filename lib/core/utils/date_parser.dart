import 'package:intl/intl.dart';

class DateParser<T> {
  final List<T> data;

  /// Função para extrair a data de T, e.g:
  /// ```dart
  /// (event) => event.dateTime!
  /// ```
  final DateTime Function(T) getDate;

  DateParser({required this.data, required this.getDate});

  static String formatDate(DateTime date, [bool showTime = false]) {
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));
    final tomorrow = now.add(const Duration(days: 1));

    String stringDate = '';

    if (isSameDay(date, tomorrow)) {
      stringDate = 'Amanhã';
    } else if (isSameDay(date, now)) {
      stringDate = 'Hoje';
    } else if (isSameDay(date, yesterday)) {
      stringDate = 'Ontem';
    } else {
      stringDate = DateFormat("d 'de' MMMM", 'pt_BR').format(date);
    }

    if(showTime){
      stringDate += ', ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    }

    return stringDate;
  }

  static bool isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year && date1.month == date2.month && date1.day == date2.day;
  }

  List<GroupedData<T>> groupByDate() {
    final Map<String, List<T>> grouped = {};

    for (var item in data) {
      final date = getDate(item);
      final formattedDate = formatDate(date);

      grouped.putIfAbsent(formattedDate, () => []).add(item);
    }

    return grouped.entries.map((entry) => GroupedData<T>(date: entry.key, values: entry.value)).toList();
  }
}

class GroupedData<T> {
  final String date;
  final List<T> values;

  GroupedData({required this.date, required this.values});
}
