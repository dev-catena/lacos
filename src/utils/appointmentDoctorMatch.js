/**
 * Indica se o compromisso pertence ao médico logado (users.id).
 * doctor_id pode ser doctors.id ou users.id; a API envia doctorUser.platform_user_id quando resolve o vínculo.
 */
/** Mesma lógica que {@link appointmentMatchesLoggedInDoctor}; use ao comparar com o médico selecionado na agenda. */
export function appointmentMatchesSelectedDoctor(appointment, selectedDoctorId) {
  return appointmentMatchesLoggedInDoctor(appointment, selectedDoctorId);
}

export function appointmentMatchesLoggedInDoctor(appointment, loggedInUserId) {
  if (loggedInUserId == null || appointment == null) {
    return false;
  }
  const currentDoctorId = Number(loggedInUserId);
  const platformUserId =
    appointment.doctorUser?.platform_user_id != null &&
    appointment.doctorUser.platform_user_id !== ''
      ? Number(appointment.doctorUser.platform_user_id)
      : null;
  const appointmentDoctorId = appointment.doctor_id ? Number(appointment.doctor_id) : null;
  const doctorUserId = appointment.doctorUser?.id ? Number(appointment.doctorUser.id) : null;
  const doctorId = appointment.doctor?.id ? Number(appointment.doctor.id) : null;
  const assignedPlatformUserId =
    appointment.assigned_platform_user_id != null && appointment.assigned_platform_user_id !== ''
      ? Number(appointment.assigned_platform_user_id)
      : null;

  if (Number.isNaN(currentDoctorId)) {
    return false;
  }

  return (
    appointmentDoctorId === currentDoctorId ||
    doctorUserId === currentDoctorId ||
    doctorId === currentDoctorId ||
    (platformUserId != null && !Number.isNaN(platformUserId) && platformUserId === currentDoctorId) ||
    (assignedPlatformUserId != null &&
      !Number.isNaN(assignedPlatformUserId) &&
      assignedPlatformUserId === currentDoctorId)
  );
}
