export function todayInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function rupee(value) {
  return "₹" + Number(value).toFixed(0);
}

export function stars(value) {
  if (value == null) {
    return "New driver";
  }
  return Number(value).toFixed(1) + " stars";
}
