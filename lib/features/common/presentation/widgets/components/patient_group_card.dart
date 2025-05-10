part of '../../../domain/entities/user.dart';

class PatientGroupCard extends StatelessWidget {
  const PatientGroupCard(this.patient, {super.key});

  final Patient patient;

  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;
    final borderRadius = BorderRadius.circular(16);
    final userData = context.read<UserCubit>();

    return Container(
      decoration:
          BoxDecoration(borderRadius: borderRadius, border: Border.all(color: CustomColor.activeColor)),
      child: InkWell(
        borderRadius: borderRadius,
        onTap: () async {
          if (patient.status == GroupStatus.pending) {
            context.pushNamed(AppRoutes.groupManagementScreen, extra: patient);
          } else {
            await userData.setDefaultPatient(patient.self.id);
            context.goNamed('home');
          }
        },
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: borderRadius,
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
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    color: Colors.black.withOpacity(0.4), // semi-transparent background
                    child: Text(
                      patient.self.fullName,
                      style: titleMedium.copyWith(color: Colors.white),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
