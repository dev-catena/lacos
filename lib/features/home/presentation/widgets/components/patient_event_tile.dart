part of '../../../domain/entities/patient_event.dart';

class PatientEventTile extends StatelessWidget {
  const PatientEventTile(this.event, {super.key});

  final PatientEvent event;

  String dateParser() {
    final date = event.dateTime;
    if(date != null){
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else {
      return 'Sem horário';
    }
  }

  Widget getTileTextData(final TextStyle titleStyle) {
    if (event.title != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            event.title!,
            style: titleStyle,
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
          Text(event.description, overflow: TextOverflow.ellipsis, maxLines: 2),
        ],
      );
    } else {
      return Text(event.description, style: titleStyle, overflow: TextOverflow.ellipsis, maxLines: 2);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bodyLarge = Theme.of(context).textTheme.bodyLarge!;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 10, right: 12),
      child: Row(
        mainAxisSize: MainAxisSize.max,
        children: [
          // Icon(event.eventType.icon),
          IconButton(
            icon: Icon(event.eventType.icon, size: 30),
            onPressed: () {},
          ),
          const SizedBox(width: 10),
          Expanded(child: getTileTextData(bodyLarge)),
          if (event.dateTime != null)
            Align(
              alignment: Alignment.bottomLeft,
              child: Text(
                dateParser(),
              ),
            ),
        ],
      ),
    );
  }
}
