export function isMedicationCompleted(med) {
  if (!med) return false;
  if (med.is_active === false) return true;
  if (!med.end_date) return false;

  const endDate = new Date(med.end_date);
  endDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return endDate <= today;
}

export function isMedicationInUse(med) {
  return !isMedicationCompleted(med);
}
