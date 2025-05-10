part of '../../../../common/domain/entities/user.dart';

class PatientResumeCard extends StatelessWidget {
  const PatientResumeCard(
    this.patient, {
    super.key,
    required this.events,
  });

  final List<PatientEvent> events;
  final Patient patient;

  List<PatientEventTile> buildEventTiles() {
    final List<PatientEventTile> tiles = [];

    for (final ele in events) {
      tiles.add(ele.buildTile());
    }
    return tiles;
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final titleMedium = Theme.of(context).textTheme.titleMedium!;

    return Container(
      width: size.width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: CustomColor.activeColor,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.asset(patient.self.photoPath),
              ),
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(16), bottomRight:  Radius.circular(16)),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      color: Colors.black.withOpacity(0.4), // semi-transparent background
                      child: Text(
                        patient.self.fullName,
                        style: titleMedium.copyWith(color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 10,
                top: 10,
                child: IconButton(
                  onPressed: () {
                    context.pushNamed(AppRoutes.patientProfileScreen);
                  },
                  icon: const Icon(Icons.settings, color: Colors.white),
                ),
              )
            ],
          ),
          ListView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: List.generate(
              events.length,
              (index) {
                final event = events[index];
                return event.buildTile();
              },
            ),
          ),
        ],
      ),
    );
  }
}
