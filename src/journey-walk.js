export function walkResult(stops, answers) {
  const rated = stops.flatMap((stop, i) =>
    stop.association.trim() && typeof answers[i] === "boolean"
      ? [answers[i]]
      : [],
  );
  const remembered = rated.filter(Boolean).length;
  const percentage = rated.length
    ? remembered === rated.length
      ? 100
      : Math.min(99, Math.round((100 * remembered) / rated.length))
    : null;
  const band =
    percentage === 100
      ? "perfect"
      : percentage >= 80
        ? "excited"
        : percentage >= 70
          ? "smile"
          : "encouraging";
  const messages = {
    encouraging: [
      "Well done!",
      "Let’s keep practising. Take your time, picture each scene, and give yourself another go.",
    ],
    smile: [
      "Good work!",
      "There’s plenty to smile about. Keep practising the scenes you missed—you’re doing well.",
    ],
    excited: [
      "Fantastic work!",
      "That’s exciting—you remembered so much of your journey! Keep those images vivid and come back for another walk.",
    ],
    perfect: [
      "Absolutely brilliant!",
      "Every association remembered—I’m over the moon! Enjoy this moment, and revisit your journey another day.",
    ],
  };
  return {
    remembered,
    total: rated.length,
    percentage,
    band,
    title: messages[band][0],
    message: messages[band][1],
  };
}
